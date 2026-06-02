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

// --- Device pairing (QR "login via mobile") ---

// Returned to the device when it starts a pairing session.
public class DeviceStartResponse
{
    // Secret the device polls with. Never displayed.
    public string DeviceCode { get; set; } = string.Empty;
    // Code embedded in the QR URL the phone opens.
    public string UserCode { get; set; } = string.Empty;
    // Seconds until the pairing expires.
    public int ExpiresInSeconds { get; set; }
    // Suggested seconds between polls.
    public int IntervalSeconds { get; set; }
}

// Device polls for approval using its secret device code.
public class DevicePollRequest
{
    public string DeviceCode { get; set; } = string.Empty;
}

// Poll result. When Status == "approved", KioskToken + AccessToken are populated
// exactly once; subsequent polls report "expired".
public class DevicePollResponse
{
    public string Status { get; set; } = string.Empty; // pending | approved | expired
    public string? KioskToken { get; set; }
    public string? AccessToken { get; set; }
}

// Admin (phone) approves a pairing identified by the user code.
public class DeviceApproveRequest
{
    public string UserCode { get; set; } = string.Empty;
}

// Public lookup so the /pair page can show pairing state before the admin logs in.
public class DeviceInfoResponse
{
    public bool Found { get; set; }
    public string Status { get; set; } = string.Empty; // pending | approved | consumed | expired | unknown
}
