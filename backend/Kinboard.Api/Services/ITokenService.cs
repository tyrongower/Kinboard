using Kinboard.Api.Models;

namespace Kinboard.Api.Services;

public interface ITokenService
{
    /// <summary>
    /// Generates a JWT access token for an admin user.
    /// Token lifetime: 15 minutes.
    /// </summary>
    string GenerateAccessToken(User user, string role);

    /// <summary>
    /// Generates a JWT access token for a kiosk.
    /// Token lifetime: 15 minutes.
    /// </summary>
    string GenerateKioskAccessToken(string kioskTokenId);

    /// <summary>
    /// Generates a cryptographically secure refresh token string.
    /// </summary>
    string GenerateRefreshTokenString();

    /// <summary>
    /// Generates a cryptographically secure kiosk token string.
    /// </summary>
    string GenerateKioskTokenString();

    /// <summary>
    /// Validates a JWT token and returns the user ID if valid.
    /// </summary>
    int? ValidateToken(string token);
}
