namespace Kinboard.Api.Dtos;

/// <summary>
/// DTO for CalendarSource that excludes sensitive information for kiosk users
/// </summary>
public class CalendarSourceDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ColorHex { get; set; } = "#1976d2";
    public bool Enabled { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;

    // IcalUrl is intentionally excluded - only backend needs it
}
