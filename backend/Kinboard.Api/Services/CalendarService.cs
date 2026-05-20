using Ical.Net;
using Ical.Net.CalendarComponents;
using Ical.Net.DataTypes;
using Kinboard.Api.Models;
using Microsoft.Extensions.Caching.Memory;

namespace Kinboard.Api.Services;

public class CalendarService : ICalendarService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CalendarService> _logger;

    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    public CalendarService(IHttpClientFactory httpClientFactory, IMemoryCache cache, ILogger<CalendarService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _cache = cache;
        _logger = logger;
    }

    public async Task<IReadOnlyList<CalendarEventDto>> GetEventsAsync(IEnumerable<CalendarSource> sources, DateTime start, DateTime end, CancellationToken ct = default)
    {
        var startUtc = ToUtc(start);
        var endUtc = ToUtc(end);
        _logger.LogDebug("Fetching calendar events from {Start} to {End} (UTC)", startUtc, endUtc);

        var list = new List<CalendarEventDto>();
        var http = _httpClientFactory.CreateClient();

        foreach (var s in sources)
        {
            if (!s.Enabled)
            {
                _logger.LogDebug("Skipping disabled calendar source: {Name}", s.Name);
                continue;
            }

            var ics = await FetchIcsAsync(http, s, ct);
            if (ics is null) continue;

            Calendar cal;
            try
            {
                cal = Calendar.Load(ics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse iCal for source: {Name}", s.Name);
                continue;
            }

            var titleIncludes = SplitCsv(s.TitleIncludes);
            var titleExcludes = SplitCsv(s.TitleExcludes);
            var categoryIncludes = SplitCsv(s.CategoryIncludes);
            var categoryExcludes = SplitCsv(s.CategoryExcludes);

            int occurrenceCount = 0;
            int filteredCount = 0;
            var rangeStart = new CalDateTime(startUtc);
            foreach (var ev in cal.Events)
            {
                var title = ev.Summary ?? string.Empty;
                var categories = ev.Categories?.ToList() ?? new List<string>();

                if (!PassesFilters(title, categories, titleIncludes, titleExcludes, categoryIncludes, categoryExcludes))
                {
                    filteredCount++;
                    continue;
                }

                IEnumerable<Occurrence> occurrences;
                try
                {
                    occurrences = ev.GetOccurrences(rangeStart);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed expanding event '{Summary}' in source {Name}", ev.Summary, s.Name);
                    continue;
                }

                foreach (var occ in occurrences)
                {
                    var (occStart, occEnd, allDay) = ExtractTimes(ev, occ);
                    if (occStart >= endUtc) break;
                    if (occEnd <= startUtc) continue;
                    list.Add(new CalendarEventDto(s.Id, s.Name, s.ColorHex, title, occStart, occEnd, allDay));
                    occurrenceCount++;
                }
            }
            _logger.LogDebug("Source {Name}: {Count} occurrences in range, {Filtered} events filtered out", s.Name, occurrenceCount, filteredCount);
        }
        _logger.LogInformation("Returning {Count} total calendar events", list.Count);
        return list;
    }

    private async Task<string?> FetchIcsAsync(HttpClient http, CalendarSource s, CancellationToken ct)
    {
        var key = $"ics::{s.IcalUrl}";
        if (_cache.TryGetValue(key, out string? cached) && cached is not null)
        {
            _logger.LogDebug("Cache hit for source: {Name}", s.Name);
            return cached;
        }
        try
        {
            _logger.LogDebug("Fetching iCal data for source: {Name}, URL: {Url}", s.Name, s.IcalUrl);
            var ics = await http.GetStringAsync(s.IcalUrl, ct);
            _cache.Set(key, ics, CacheTtl);
            _logger.LogInformation("Fetched and cached iCal for source: {Name}", s.Name);
            return ics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch iCal for source: {Name}, URL: {Url}", s.Name, s.IcalUrl);
            return null;
        }
    }

    private static (DateTime Start, DateTime End, bool AllDay) ExtractTimes(CalendarEvent ev, Occurrence occ)
    {
        bool allDay = ev.Start is not null && !ev.Start.HasTime;

        var period = occ.Period;

        // All-day events are date-only in iCal (VALUE=DATE). They represent calendar days
        // in the viewer's local time, not a fixed UTC instant. Emit as Unspecified so JSON
        // serializes without a Z suffix and clients treat as floating local midnight.
        if (allDay)
        {
            var localStart = period.StartTime?.Value ?? DateTime.Today;
            DateTime localEnd;
            if (period.EndTime is not null)
            {
                localEnd = period.EndTime.Value;
            }
            else if (period.Duration is { } durLocal)
            {
                localEnd = localStart + durLocal.ToTimeSpanUnspecified();
            }
            else
            {
                localEnd = localStart.AddDays(1);
            }
            return (
                DateTime.SpecifyKind(localStart, DateTimeKind.Unspecified),
                DateTime.SpecifyKind(localEnd, DateTimeKind.Unspecified),
                true);
        }

        var startUtc = period.StartTime?.AsUtc ?? DateTime.UtcNow;
        DateTime endUtc;

        if (period.EndTime is not null)
        {
            endUtc = period.EndTime.AsUtc;
        }
        else if (period.Duration is { } dur)
        {
            endUtc = startUtc + dur.ToTimeSpanUnspecified();
        }
        else
        {
            endUtc = startUtc.AddHours(1);
        }

        return (DateTime.SpecifyKind(startUtc, DateTimeKind.Utc), DateTime.SpecifyKind(endUtc, DateTimeKind.Utc), false);
    }

    private static DateTime ToUtc(DateTime dt)
    {
        return dt.Kind switch
        {
            DateTimeKind.Utc => dt,
            DateTimeKind.Local => dt.ToUniversalTime(),
            _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc)
        };
    }

    private static string[] SplitCsv(string? csv)
    {
        if (string.IsNullOrWhiteSpace(csv)) return Array.Empty<string>();
        return csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }

    private static bool PassesFilters(
        string title,
        IReadOnlyCollection<string> categories,
        string[] titleIncludes,
        string[] titleExcludes,
        string[] categoryIncludes,
        string[] categoryExcludes)
    {
        var cmp = StringComparison.OrdinalIgnoreCase;

        if (titleExcludes.Length > 0 && titleExcludes.Any(p => title.Contains(p, cmp))) return false;
        if (categoryExcludes.Length > 0 && categories.Any(c => categoryExcludes.Any(p => c.Equals(p, cmp)))) return false;

        if (titleIncludes.Length > 0 && !titleIncludes.Any(p => title.Contains(p, cmp))) return false;
        if (categoryIncludes.Length > 0 && !categories.Any(c => categoryIncludes.Any(p => c.Equals(p, cmp)))) return false;

        return true;
    }
}
