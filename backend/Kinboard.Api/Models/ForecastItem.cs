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
}