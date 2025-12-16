namespace Kinboard.Api.Services;

public record CalendarEventDto
(
    int SourceId,
    string SourceName,
    string ColorHex,
    string Title,
    DateTime Start,
    DateTime End,
    bool AllDay
);