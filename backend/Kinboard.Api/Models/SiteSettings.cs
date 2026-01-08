namespace Kinboard.Api.Models;

// Renamed to a more generic settings container for the site
public class SiteSettings
{
    public int Id { get; set; }
    // Day | Week | Month
    public string DefaultView { get; set; } = "Day";
    // Today | VisibleRange
    public string CompletionMode { get; set; } = "Today";

    // Auto-refresh intervals (in seconds)
    // Chores default: 10s
    public int ChoresRefreshSeconds { get; set; } = 10;
    // Calendar default: 30s
    public int CalendarRefreshSeconds { get; set; } = 30;
    // Weather default: 30 minutes (1800s)
    public int WeatherRefreshSeconds { get; set; } = 1800;

    // Weather API settings
    public string? WeatherApiKey { get; set; }
    public string? WeatherLocation { get; set; }

    // Email settings
    public string? MailgunApiKey { get; set; }
    public string? MailgunDomain { get; set; }
    public string? MailgunFromEmail { get; set; }
    public string? SiteUrl { get; set; }
}
