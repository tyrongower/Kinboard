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

    // Per-source server-side filters. Comma-separated substrings (case-insensitive).
    // Empty = no filter. Includes act as OR — event passes if any include matches.
    // Excludes act as OR — event blocked if any exclude matches. Excludes win over includes.
    public string? TitleIncludes { get; set; }
    public string? TitleExcludes { get; set; }
    public string? CategoryIncludes { get; set; }
    public string? CategoryExcludes { get; set; }
}
