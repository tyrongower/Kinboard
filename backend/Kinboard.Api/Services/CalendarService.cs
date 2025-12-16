using Kinboard.Api.Models;
using Microsoft.Extensions.Caching.Memory;

namespace Kinboard.Api.Services;

public class CalendarService : ICalendarService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CalendarService> _logger;

    public CalendarService(IHttpClientFactory httpClientFactory, IMemoryCache cache, ILogger<CalendarService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _cache = cache;
        _logger = logger;
    }

    public async Task<IReadOnlyList<CalendarEventDto>> GetEventsAsync(IEnumerable<CalendarSource> sources, DateTime start, DateTime end, CancellationToken ct = default)
    {
        _logger.LogDebug("Fetching calendar events from {Start} to {End}", start, end);
        var list = new List<CalendarEventDto>();
        var http = _httpClientFactory.CreateClient();
        foreach (var s in sources)
        {
            if (!s.Enabled)
            {
                _logger.LogDebug("Skipping disabled calendar source: {Name}", s.Name);
                continue;
            }
            var key = $"ics::{s.IcalUrl}";
            string ics;
            if (!_cache.TryGetValue(key, out ics!))
            {
                try
                {
                    _logger.LogDebug("Fetching iCal data for source: {Name}, URL: {Url}", s.Name, s.IcalUrl);
                    ics = await http.GetStringAsync(s.IcalUrl, ct);
                    _cache.Set(key, ics, TimeSpan.FromMinutes(5));
                    _logger.LogInformation("Successfully fetched and cached iCal data for source: {Name}", s.Name);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to fetch iCal data for source: {Name}, URL: {Url}", s.Name, s.IcalUrl);
                    continue; // skip broken sources
                }
            }
            else
            {
                _logger.LogDebug("Using cached iCal data for source: {Name}", s.Name);
            }

            var parsedEvents = ParseIcs(ics).ToList();
            _logger.LogDebug("Parsed {Count} events from source: {Name}", parsedEvents.Count, s.Name);

            foreach (var e in parsedEvents)
            {
                // include only if intersects [start, end]
                if (e.End > start && e.Start < end)
                {
                    list.Add(new CalendarEventDto(s.Id, s.Name, s.ColorHex, e.Title, e.Start, e.End, e.AllDay));
                }
            }
        }
        _logger.LogInformation("Returning {Count} total calendar events", list.Count);
        return list;
    }

    private sealed record ParsedEvent(string Title, DateTime Start, DateTime End, bool AllDay);

    private static IEnumerable<ParsedEvent> ParseIcs(string ics)
    {
        // Handle line folding (RFC 5545): lines starting with space/tab are continuations
        var lines = new List<string>();
        string? prev = null;
        using (var reader = new StringReader(ics))
        {
            string? raw;
            while ((raw = reader.ReadLine()) != null)
            {
                if (raw.Length > 0 && (raw[0] == ' ' || raw[0] == '\t'))
                {
                    prev += raw.TrimStart();
                }
                else
                {
                    if (prev != null) lines.Add(prev);
                    prev = raw;
                }
            }
            if (prev != null) lines.Add(prev);
        }

        var events = new List<ParsedEvent>();
        bool inEvent = false;
        string title = string.Empty;
        DateTime? dtStart = null;
        DateTime? dtEnd = null;
        bool allDay = false;

        foreach (var ln in lines)
        {
            if (ln.StartsWith("BEGIN:VEVENT", StringComparison.OrdinalIgnoreCase))
            {
                inEvent = true; title = string.Empty; dtStart = null; dtEnd = null; allDay = false;
            }
            else if (ln.StartsWith("END:VEVENT", StringComparison.OrdinalIgnoreCase))
            {
                if (inEvent && dtStart.HasValue)
                {
                    var end = dtEnd ?? dtStart.Value.AddHours(1);
                    events.Add(new ParsedEvent(title, dtStart.Value, end, allDay));
                }
                inEvent = false;
            }
            else if (inEvent)
            {
                if (ln.StartsWith("SUMMARY:", StringComparison.OrdinalIgnoreCase))
                {
                    title = Unescape(ln.Substring(8));
                }
                else if (ln.StartsWith("DTSTART", StringComparison.OrdinalIgnoreCase))
                {
                    (dtStart, var isAllDay) = ParseDateTime(ln);
                    allDay = isAllDay;
                }
                else if (ln.StartsWith("DTEND", StringComparison.OrdinalIgnoreCase))
                {
                    (dtEnd, var isAllDay2) = ParseDateTime(ln);
                    allDay = allDay || isAllDay2;
                }
            }
        }
        return events;
    }

    private static (DateTime?, bool) ParseDateTime(string line)
    {
        // Examples: DTSTART:20250101T120000Z, DTSTART;VALUE=DATE:20250101, DTSTART;TZID=Europe/London:20250101T090000
        var parts = line.Split(':', 2);
        if (parts.Length != 2) return (null, false);
        var prop = parts[0];
        var val = parts[1].Trim();
        bool allDay = prop.Contains("VALUE=DATE", StringComparison.OrdinalIgnoreCase);
        try
        {
            if (allDay)
            {
                // YYYYMMDD as local date
                if (DateTime.TryParseExact(val, "yyyyMMdd", null, System.Globalization.DateTimeStyles.AssumeLocal, out var d))
                {
                    return (d.Date, true);
                }
            }
            else if (val.EndsWith("Z", StringComparison.Ordinal))
            {
                if (DateTime.TryParseExact(val, "yyyyMMdd'T'HHmmss'Z'", null, System.Globalization.DateTimeStyles.AdjustToUniversal, out var z))
                {
                    return (z.ToLocalTime(), false);
                }
            }
            else
            {
                if (DateTime.TryParseExact(val, "yyyyMMdd'T'HHmmss", null, System.Globalization.DateTimeStyles.AssumeLocal, out var l))
                {
                    return (l, false);
                }
            }
        }
        catch { }
        return (null, false);
    }

    private static string Unescape(string s)
    {
        return s.Replace("\\n", "\n").Replace("\\,", ",").Replace("\\;", ";");
    }
}
