using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kinboard.Api.Data;
using Kinboard.Api.Services;

namespace Kinboard.Api.Controllers;

[ApiController]
[Route("api/calendar/events")]
[Authorize] // Require authentication (admin + kiosk)
public class CalendarEventsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICalendarService _calendarService;
    private readonly ILogger<CalendarEventsController> _logger;

    public CalendarEventsController(AppDbContext context, ICalendarService calendarService, ILogger<CalendarEventsController> logger)
    {
        _context = context;
        _calendarService = calendarService;
        _logger = logger;
    }

    // GET api/calendar/events?start=2025-01-01&end=2025-01-31&include=1,2
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string start, [FromQuery] string end, [FromQuery] string? include = null)
    {
        try
        {
            _logger.LogDebug("Fetching calendar events from {Start} to {End}", start, end);

            if (!DateTime.TryParse(start, out var startDt) || !DateTime.TryParse(end, out var endDt))
            {
                _logger.LogWarning("Invalid start or end date provided: start={Start}, end={End}", start, end);
                return BadRequest(new { message = "Invalid start or end date format" });
            }

            var q = _context.CalendarSources.AsNoTracking().OrderBy(c => c.DisplayOrder);
            if (!string.IsNullOrWhiteSpace(include))
            {
                var ids = include.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                                 .Select(s => int.TryParse(s, out var id) ? id : (int?)null)
                                 .Where(id => id.HasValue)
                                 .Select(id => id!.Value)
                                 .ToHashSet();
                q = q.Where(c => ids.Contains(c.Id)).OrderBy(c => c.DisplayOrder);
                _logger.LogDebug("Filtering calendar sources by IDs: {Ids}", string.Join(", ", ids));
            }

            var sources = await q.ToListAsync();
            _logger.LogInformation("Fetching events from {SourceCount} calendar sources", sources.Count);

            var events = await _calendarService.GetEventsAsync(sources, startDt, endDt, HttpContext.RequestAborted);
            _logger.LogInformation("Retrieved {EventCount} calendar events", events.Count);

            var shaped = events.Select(e => new
            {
                sourceId = e.SourceId,
                sourceName = e.SourceName,
                colorHex = e.ColorHex,
                title = e.Title,
                start = e.Start,
                end = e.End,
                allDay = e.AllDay
            });
            return Ok(shaped);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error fetching calendar events from {Start} to {End}", start, end);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error fetching calendar events from {Start} to {End}", start, end);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }
}
