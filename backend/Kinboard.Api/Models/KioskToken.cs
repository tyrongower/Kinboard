namespace Kinboard.Api.Models;

/// <summary>
/// Represents a kiosk access token.
/// Kiosk tokens are NOT tied to users and do not expire unless explicitly revoked.
/// They are passed via URL and grant kiosk-only access.
/// </summary>
public class KioskToken
{
    public int Id { get; set; }

    // The token value (cryptographically secure random string)
    public string Token { get; set; } = string.Empty;

    // Friendly name for this kiosk token (e.g., "Living Room Kiosk", "Kitchen Display")
    public string Name { get; set; } = string.Empty;

    // When this token was created
    public DateTime CreatedAt { get; set; }

    // When this token was revoked (null if still active)
    public DateTime? RevokedAt { get; set; }

    // Reason for revocation (e.g., "Admin revoked", "Security")
    public string? RevocationReason { get; set; }

    // Computed property: is this token still valid?
    public bool IsActive => RevokedAt == null;
}
