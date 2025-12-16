namespace Kinboard.Api.Models;

public class CalendarSource
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string IcalUrl { get; set; } = string.Empty;
    // Hex color like #RRGGBB
    public string ColorHex { get; set; } = "#1976d2";
    public bool Enabled { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
}
