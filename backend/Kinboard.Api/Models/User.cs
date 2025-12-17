namespace Kinboard.Api.Models;

public class User
{
    public int Id { get; set; }

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

    // --- Authentication fields (optional, only for admin users) ---

    // Email for admin login (null for non-admin users)
    public string? Email { get; set; }

    // Hashed password for admin login (null for non-admin users)
    public string? PasswordHash { get; set; }

    // Is this user an admin? (can log into admin portal)
    public bool IsAdmin { get; set; } = false;

    // Navigation collection for job assignments
    public ICollection<JobAssignment> JobAssignments { get; set; } = new List<JobAssignment>();

    // Navigation collection for refresh tokens (admin only)
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
