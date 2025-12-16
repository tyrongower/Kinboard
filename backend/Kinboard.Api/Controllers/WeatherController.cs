using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kinboard.Api.Data;
using Kinboard.Api.Models;
using System.Text.Json;

namespace Kinboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WeatherController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly HttpClient _httpClient;
    private readonly ILogger<WeatherController> _logger;

    public WeatherController(AppDbContext context, IHttpClientFactory httpClientFactory, ILogger<WeatherController> logger)
    {
        _context = context;
        _httpClient = httpClientFactory.CreateClient();
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<WeatherResponse>> GetWeather()
    {
        try
        {
            _logger.LogDebug("Fetching weather data");
            var settings = await _context.SiteSettings.AsNoTracking().FirstOrDefaultAsync();
            var apiKey = settings?.WeatherApiKey;
            var location = settings?.WeatherLocation ?? "New York";
            _logger.LogDebug("Weather location: {Location}", location);

            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("Weather API key is not configured");
                // No API key configured -> return clear error, no mock data
                return Problem(
                    detail: "Weather API key is not configured.",
                    statusCode: StatusCodes.Status503ServiceUnavailable,
                    title: "Weather Unavailable");
            }

            // WeatherAPI.com forecast (docs: https://www.weatherapi.com/docs/)
            // Request up to 6 days (today + next 5). Free tiers may return fewer; we'll handle gracefully.
            var url = $"https://api.weatherapi.com/v1/forecast.json?key={apiKey}&q={Uri.EscapeDataString(location)}&days=6&aqi=no&alerts=no";
            _logger.LogDebug("Calling weather API for location: {Location}", location);
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                var errorMessage = $"Failed to fetch weather data: {response.StatusCode}";
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogError("Weather API error: {StatusCode}, Response: {Content}", response.StatusCode, content);
                // Surface an error status to the client, no mock data
                return StatusCode(StatusCodes.Status502BadGateway, new { error = errorMessage });
            }

            var json = await response.Content.ReadAsStringAsync();
            var weatherData = JsonSerializer.Deserialize<JsonElement>(json);

            // Map WeatherAPI fields
            var current = weatherData.GetProperty("current");
            var forecastDays = weatherData.GetProperty("forecast").GetProperty("forecastday");

            var todayDay = forecastDays[0].GetProperty("day");
            var tomorrowDay = forecastDays.GetArrayLength() > 1 ? forecastDays[1].GetProperty("day") : todayDay;

            var condition = current.GetProperty("condition");
            static string NormalizeIconUrl(string? icon)
            {
                if (string.IsNullOrWhiteSpace(icon)) return string.Empty;
                return icon.StartsWith("//") ? "https:" + icon : icon;
            }

            static int ReadInt(JsonElement element, string propertyName, int defaultValue = 0)
            {
                if (!element.TryGetProperty(propertyName, out var value)) return defaultValue;
                return value.ValueKind switch
                {
                    JsonValueKind.Number => value.TryGetInt32(out var n) ? n : defaultValue,
                    JsonValueKind.String => int.TryParse(value.GetString(), out var s) ? s : defaultValue,
                    _ => defaultValue
                };
            }

            var iconPath = NormalizeIconUrl(condition.GetProperty("icon").GetString()); // may start with //

            // Build Forecast5 (skip today, take next up to 5 days)
            var daysArray = new List<ForecastItem>();
            var totalDays = forecastDays.GetArrayLength();
            for (int i = 1; i < Math.Min(totalDays, 6); i++)
            {
                var fd = forecastDays[i];
                var day = fd.GetProperty("day");
                var dateStr = fd.GetProperty("date").GetString() ?? string.Empty;
                var dCondition = day.GetProperty("condition");
                daysArray.Add(new ForecastItem
                {
                    Date = dateStr,
                    AvgTempC = day.GetProperty("avgtemp_c").GetDouble(),
                    MinTempC = day.GetProperty("mintemp_c").GetDouble(),
                    MaxTempC = day.GetProperty("maxtemp_c").GetDouble(),
                    TotalPrecipMm = day.GetProperty("totalprecip_mm").GetDouble(),
                    ChanceOfRainPercent = ReadInt(day, "daily_chance_of_rain", 0),
                    ConditionIconUrl = NormalizeIconUrl(dCondition.GetProperty("icon").GetString())
                });
            }

            var weatherResponse = new WeatherResponse
            {
                CurrentTempC = current.GetProperty("temp_c").GetDouble(),
                FeelsLikeC = current.GetProperty("feelslike_c").GetDouble(),
                ConditionText = condition.GetProperty("text").GetString() ?? "",
                ConditionIconUrl = iconPath,
                Humidity = current.GetProperty("humidity").GetInt32(),
                WindKph = current.GetProperty("wind_kph").GetDouble(),
                TodayMinTempC = todayDay.GetProperty("mintemp_c").GetDouble(),
                TodayMaxTempC = todayDay.GetProperty("maxtemp_c").GetDouble(),
                TodayPrecipMm = todayDay.GetProperty("totalprecip_mm").GetDouble(),
                TomorrowAvgTempC = tomorrowDay.GetProperty("avgtemp_c").GetDouble(),
                TomorrowPrecipMm = tomorrowDay.GetProperty("totalprecip_mm").GetDouble(),
                Forecast5 = daysArray
            };

            _logger.LogInformation("Weather data retrieved successfully for location: {Location}", location);
            return Ok(weatherResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching weather data");
            // Unexpected server error -> return 500 with message, no mock data
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Unexpected error while fetching weather data.", details = ex.Message });
        }
    }
}
