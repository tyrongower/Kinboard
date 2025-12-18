using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kinboard.Api.Data;
using Kinboard.Api.Models;
using System.Text.Json;

namespace Kinboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Require authentication (admin + kiosk)
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
        var settings = await _context.SiteSettings.AsNoTracking().FirstOrDefaultAsync();
        try
        {
            _logger.LogDebug("Fetching weather data");

            var apiKey = settings?.WeatherApiKey;
            var location = settings?.WeatherLocation ?? "New York";
            _logger.LogDebug("Weather location: {Location}", location);

            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("Weather API key is not configured");
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "Weather API key is not configured" });
            }

            var url = $"https://api.weatherapi.com/v1/forecast.json?key={apiKey}&q={Uri.EscapeDataString(location)}&days=5&aqi=no&alerts=no";
            _logger.LogDebug("Calling weather API for location: {Location}", location);
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogError("Weather API error: {StatusCode}, Response: {Content}", response.StatusCode, content);
                return StatusCode(StatusCodes.Status502BadGateway, new { message = $"Failed to fetch weather data: {response.StatusCode}" });
            }

            var json = await response.Content.ReadAsStringAsync();
            var weatherData = JsonSerializer.Deserialize<JsonElement>(json);

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

            var iconPath = NormalizeIconUrl(condition.GetProperty("icon").GetString());

            var daysArray = new List<ForecastItem>();
            var totalDays = forecastDays.GetArrayLength();
            for (int i = 0; i < Math.Min(totalDays, 3); i++)
            {
                var fd = forecastDays[i];
                var day = fd.GetProperty("day");
                var dateStr = fd.GetProperty("date").GetString() ?? string.Empty;
                var dCondition = day.GetProperty("condition");
                var astro = fd.TryGetProperty("astro", out var astroEl) ? astroEl : default;

                string sunrise = string.Empty;
                string sunset = string.Empty;
                if (astro.ValueKind != JsonValueKind.Undefined && astro.ValueKind != JsonValueKind.Null)
                {
                    sunrise = astro.TryGetProperty("sunrise", out var sr) ? sr.GetString() ?? string.Empty : string.Empty;
                    sunset = astro.TryGetProperty("sunset", out var ss) ? ss.GetString() ?? string.Empty : string.Empty;
                }

                daysArray.Add(new ForecastItem
                {
                    Date = dateStr,
                    AvgTempC = day.GetProperty("avgtemp_c").GetDouble(),
                    MinTempC = day.GetProperty("mintemp_c").GetDouble(),
                    MaxTempC = day.GetProperty("maxtemp_c").GetDouble(),
                    TotalPrecipMm = day.GetProperty("totalprecip_mm").GetDouble(),
                    ChanceOfRainPercent = ReadInt(day, "daily_chance_of_rain", 0),
                    ConditionIconUrl = NormalizeIconUrl(dCondition.GetProperty("icon").GetString()),
                    ConditionText = dCondition.GetProperty("text").GetString() ?? string.Empty,
                    MaxWindKph = day.TryGetProperty("maxwind_kph", out var mw) ? mw.GetDouble() : 0,
                    AvgHumidity = ReadInt(day, "avghumidity", 0),
                    Uv = day.TryGetProperty("uv", out var uv) ? uv.GetDouble() : 0,
                    Sunrise = sunrise,
                    Sunset = sunset,
                    AvgVisKm = day.TryGetProperty("avgvis_km", out var vis) ? vis.GetDouble() : 0,
                    TotalSnowCm = day.TryGetProperty("totalsnow_cm", out var snow) ? snow.GetDouble() : 0,
                    DailyChanceOfSnow = ReadInt(day, "daily_chance_of_snow", 0),
                    DailyWillItRain = ReadInt(day, "daily_will_it_rain", 0)
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
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error while fetching weather data for location: {Location}", settings?.WeatherLocation ?? "Unknown");
            return StatusCode(StatusCodes.Status502BadGateway, new { message = "Failed to connect to weather service" });
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "Timeout while fetching weather data for location: {Location}", settings?.WeatherLocation ?? "Unknown");
            return StatusCode(StatusCodes.Status504GatewayTimeout, new { message = "Weather service request timed out" });
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Error parsing weather data for location: {Location}", settings?.WeatherLocation ?? "Unknown");
            return StatusCode(StatusCodes.Status502BadGateway, new { message = "Invalid weather data received" });
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error while fetching weather data");
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching weather data");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred" });
        }
    }
}
