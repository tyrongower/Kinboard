namespace Kinboard.Api.Models;

public class WeatherResponse
{
    // Current conditions
    public double CurrentTempC { get; set; }
    public double FeelsLikeC { get; set; }
    public string ConditionText { get; set; } = string.Empty;
    public string ConditionIconUrl { get; set; } = string.Empty;
    public int Humidity { get; set; }
    public double WindKph { get; set; }

    // Today summary
    public double TodayMinTempC { get; set; }
    public double TodayMaxTempC { get; set; }

    // Accumulated precipitation for today (mm)
    public double TodayPrecipMm { get; set; }

    // Forecast for tomorrow
    public double TomorrowAvgTempC { get; set; }
    public double TomorrowPrecipMm { get; set; }

    // Compact forecast for the next 5 days (excluding today)
    public List<ForecastItem> Forecast5 { get; set; } = new();
}