namespace Kinboard.Api.Models;

/// <summary>
/// Represents a refresh token for admin users.
/// Enables persistent authentication across browser sessions.
/// Tokens are rotating (replaced on each refresh) for enhanced security.
/// </summary>
public class RefreshToken
{
    public int Id { get; set; }

    // The token value (cryptographically secure random string)
    public string Token { get; set; } = string.Empty;

    // Foreign key to the admin user
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    // Expiration datetime (7 days from creation)
    public DateTime ExpiresAt { get; set; }

    // When this token was created
    public DateTime CreatedAt { get; set; }

    // If this token was replaced by a newer one (token rotation)
    public DateTime? RevokedAt { get; set; }

    // The new token that replaced this one (if rotated)
    public string? ReplacedByToken { get; set; }

    // Reason for revocation (e.g., "Logout", "Token rotation", "Security")
    public string? RevocationReason { get; set; }

    // Computed property: is this token still valid?
    public bool IsActive => RevokedAt == null && DateTime.UtcNow < ExpiresAt;
}
