using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kinboard.Api.Data;
using Kinboard.Api.Models;

namespace Kinboard.Api.Controllers;

[ApiController]
[Route("api/sitesettings")]
public class SiteSettingsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<SiteSettingsController> _logger;

    public SiteSettingsController(AppDbContext context, ILogger<SiteSettingsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<SiteSettings>> Get()
    {
        try
        {
            _logger.LogDebug("Fetching site settings");
            var settings = await _context.SiteSettings.AsNoTracking().FirstOrDefaultAsync();
            if (settings == null)
            {
                _logger.LogInformation("No site settings found, initializing with defaults");
                // Initialize defaults if not present
                settings = new SiteSettings
                {
                    DefaultView = "Day",
                    CompletionMode = "Today",
                    ChoresRefreshSeconds = 10,
                    CalendarRefreshSeconds = 30,
                    WeatherRefreshSeconds = 1800,
                };
                _context.SiteSettings.Add(settings);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Site settings initialized with defaults");
            }
            else
            {
                // Fill missing/zero values with defaults for backward compatibility
                var changed = false;
                if (settings.ChoresRefreshSeconds <= 0) { settings.ChoresRefreshSeconds = 10; changed = true; }
                if (settings.CalendarRefreshSeconds <= 0) { settings.CalendarRefreshSeconds = 30; changed = true; }
                if (settings.WeatherRefreshSeconds <= 0) { settings.WeatherRefreshSeconds = 1800; changed = true; }
                if (changed)
                {
                    _logger.LogInformation("Updating site settings with missing defaults");
                    _context.SiteSettings.Update(settings);
                    await _context.SaveChangesAsync();
                }
            }
            return Ok(settings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching site settings");
            throw;
        }
    }

    [HttpPut]
    public async Task<IActionResult> Update(SiteSettings updated)
    {
        try
        {
            _logger.LogInformation("Updating site settings");
            var settings = await _context.SiteSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                _logger.LogInformation("No existing settings found, creating new settings");
                updated.DefaultView = NormalizeView(updated.DefaultView);
                updated.CompletionMode = NormalizeCompletion(updated.CompletionMode);
                NormalizeIntervals(updated);
                _context.SiteSettings.Add(updated);
            }
            else
            {
                _logger.LogDebug("Updating existing site settings");
                settings.DefaultView = NormalizeView(updated.DefaultView);
                settings.CompletionMode = NormalizeCompletion(updated.CompletionMode);
                // Intervals with min bounds to avoid too frequent polling
                settings.ChoresRefreshSeconds = NormalizeInterval(updated.ChoresRefreshSeconds, 5, 3600, 10);
                settings.CalendarRefreshSeconds = NormalizeInterval(updated.CalendarRefreshSeconds, 5, 3600, 30);
                settings.WeatherRefreshSeconds = NormalizeInterval(updated.WeatherRefreshSeconds, 300, 24 * 3600, 1800);
                settings.WeatherApiKey = updated.WeatherApiKey;
                settings.WeatherLocation = updated.WeatherLocation;
                _context.Entry(settings).State = EntityState.Modified;
            }
            await _context.SaveChangesAsync();
            _logger.LogInformation("Site settings updated successfully");
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating site settings");
            throw;
        }
    }

    private static string NormalizeView(string v)
    {
        return v?.Trim() switch
        {
            "Day" or "day" => "Day",
            "Week" or "week" => "Week",
            "Month" or "month" => "Month",
            _ => "Day"
        };
    }

    private static string NormalizeCompletion(string v)
    {
        return v?.Trim() switch
        {
            "Today" or "today" => "Today",
            "VisibleRange" or "visibleRange" or "Range" or "range" => "VisibleRange",
            _ => "Today"
        };
    }

    private static void NormalizeIntervals(SiteSettings s)
    {
        s.ChoresRefreshSeconds = NormalizeInterval(s.ChoresRefreshSeconds, 5, 3600, 10);
        s.CalendarRefreshSeconds = NormalizeInterval(s.CalendarRefreshSeconds, 5, 3600, 30);
        s.WeatherRefreshSeconds = NormalizeInterval(s.WeatherRefreshSeconds, 300, 24 * 3600, 1800);
    }

    private static int NormalizeInterval(int value, int min, int max, int fallback)
    {
        if (value <= 0) return fallback;
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
}
