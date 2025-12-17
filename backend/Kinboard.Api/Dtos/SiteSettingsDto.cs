namespace Kinboard.Api.Dtos;

/// <summary>
/// DTO for SiteSettings that excludes sensitive information for kiosk users
/// </summary>
public class SiteSettingsDto
{
    public int Id { get; set; }
    public string DefaultView { get; set; } = "Day";
    public string CompletionMode { get; set; } = "Today";
    public int ChoresRefreshSeconds { get; set; } = 10;
    public int CalendarRefreshSeconds { get; set; } = 30;
    public int WeatherRefreshSeconds { get; set; } = 1800;
    public string? WeatherLocation { get; set; }

    // WeatherApiKey is intentionally excluded - only backend needs it
}
