using Kinboard.Api.Models;

namespace Kinboard.Api.Services;

public interface ICalendarService
{
    Task<IReadOnlyList<CalendarEventDto>> GetEventsAsync(IEnumerable<CalendarSource> sources, DateTime start, DateTime end, CancellationToken ct = default);
}
