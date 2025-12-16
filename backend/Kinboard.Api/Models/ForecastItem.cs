namespace Kinboard.Api.Models;

public class ForecastItem
{
    public string Date { get; set; } = string.Empty; // ISO date string (yyyy-MM-dd)
    public double AvgTempC { get; set; }
    public double MinTempC { get; set; }
    public double MaxTempC { get; set; }
    public double TotalPrecipMm { get; set; }
    public int ChanceOfRainPercent { get; set; }
    public string ConditionIconUrl { get; set; } = string.Empty;
    // Extra details for rich forecast views
    public string ConditionText { get; set; } = string.Empty;
    public double MaxWindKph { get; set; }
    public int AvgHumidity { get; set; }
    public double Uv { get; set; }
    public string Sunrise { get; set; } = string.Empty; // e.g., 07:23 AM
    public string Sunset { get; set; } = string.Empty;  // e.g., 04:51 PM
    public double AvgVisKm { get; set; }
    public double TotalSnowCm { get; set; }
    public int DailyChanceOfSnow { get; set; }
    public int DailyWillItRain { get; set; }
}
