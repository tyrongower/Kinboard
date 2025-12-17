namespace Kinboard.Api.Dtos;

// Admin authentication request
public class AdminLoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

// Response after successful login or refresh
public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // "admin" or "kiosk"
    public UserInfo? User { get; set; } // Only for admin
}

// User information returned in auth response
public class UserInfo
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}

// Kiosk authentication request
public class KioskAuthRequest
{
    public string Token { get; set; } = string.Empty;
}

// Admin can create kiosk tokens
public class CreateKioskTokenRequest
{
    public string Name { get; set; } = string.Empty;
}

// Response when creating a kiosk token
public class KioskTokenResponse
{
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

// List of kiosk tokens (for admin management)
public class KioskTokenListItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}
