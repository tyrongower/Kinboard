namespace Kinboard.Api.Models;

public class User
{
    public int Id { get; set; }

    // A stable key used for linking from jobs (e.g., username or short code)
    public string Username { get; set; } = string.Empty;

    // Friendly name to display in UI
    public string DisplayName { get; set; } = string.Empty;

    // Hex color like #RRGGBB used for UI accents
    public string ColorHex { get; set; } = "#777777";

    // Preference: whether the kiosk should hide completed jobs by default for this user
    public bool HideCompletedInKiosk { get; set; } = true;

    // Optional URL to an avatar image (served as static file)
    public string? AvatarUrl { get; set; }

    // Display order for kiosk and admin lists (lower first)
    public int DisplayOrder { get; set; } = 0;
    
    // Navigation collection for job assignments
    public ICollection<JobAssignment> JobAssignments { get; set; } = new List<JobAssignment>();
}
