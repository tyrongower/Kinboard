using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kinboard.Api.Data;
using Kinboard.Api.Dtos;
using Kinboard.Api.Models;
using Kinboard.Api.Services;
using BCrypt.Net;

namespace Kinboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthController> _logger;
    private readonly IWebHostEnvironment _env;

    public AuthController(
        AppDbContext context,
        ITokenService tokenService,
        ILogger<AuthController> logger,
        IWebHostEnvironment env)
    {
        _context = context;
        _tokenService = tokenService;
        _logger = logger;
        _env = env;
    }

    /// <summary>
    /// Admin login endpoint.
    /// Validates credentials and returns access token + sets refresh token cookie.
    /// </summary>
    [HttpPost("admin/login")]
    public async Task<ActionResult<AuthResponse>> AdminLogin([FromBody] AdminLoginRequest request)
    {
        // Find user by email
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsAdmin);

        if (user == null || string.IsNullOrEmpty(user.PasswordHash))
        {
            _logger.LogWarning("Login attempt for non-existent or non-admin user: {Email}", request.Email);
            return Unauthorized(new { message = "Invalid credentials" });
        }

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("Failed login attempt for user: {Email}", request.Email);
            return Unauthorized(new { message = "Invalid credentials" });
        }

        // Generate tokens
        var accessToken = _tokenService.GenerateAccessToken(user, "admin");
        var refreshTokenString = _tokenService.GenerateRefreshTokenString();

        // Save refresh token to database
        var refreshToken = new RefreshToken
        {
            Token = refreshTokenString,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        // Set refresh token as HttpOnly cookie
        SetRefreshTokenCookie(refreshTokenString);

        _logger.LogInformation("Admin user logged in: {Email}", user.Email);

        return Ok(new AuthResponse
        {
            AccessToken = accessToken,
            Role = "admin",
            User = new UserInfo
            {
                Id = user.Id,
                Email = user.Email ?? "",
                DisplayName = user.DisplayName
            }
        });
    }

    /// <summary>
    /// Refresh access token using refresh token from cookie.
    /// Implements token rotation (old refresh token is replaced).
    /// </summary>
    [HttpPost("admin/refresh")]
    public async Task<ActionResult<AuthResponse>> AdminRefresh()
    {
        var refreshTokenString = Request.Cookies["refreshToken"];

        if (string.IsNullOrEmpty(refreshTokenString))
        {
            return Unauthorized(new { message = "No refresh token provided" });
        }

        // Find refresh token in database
        var refreshToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshTokenString);

        if (refreshToken == null)
        {
            _logger.LogWarning("Refresh attempt with unknown token");
            return Unauthorized(new { message = "Invalid refresh token" });
        }

        if (!refreshToken.IsActive)
        {
            _logger.LogWarning("Refresh attempt with inactive token for user: {UserId}", refreshToken.UserId);
            return Unauthorized(new { message = "Refresh token expired or revoked" });
        }

        // Generate new tokens
        var accessToken = _tokenService.GenerateAccessToken(refreshToken.User, "admin");
        var newRefreshTokenString = _tokenService.GenerateRefreshTokenString();

        // Revoke old refresh token (token rotation)
        refreshToken.RevokedAt = DateTime.UtcNow;
        refreshToken.ReplacedByToken = newRefreshTokenString;
        refreshToken.RevocationReason = "Token rotation";

        // Create new refresh token
        var newRefreshToken = new RefreshToken
        {
            Token = newRefreshTokenString,
            UserId = refreshToken.UserId,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(newRefreshToken);
        await _context.SaveChangesAsync();

        // Set new refresh token cookie
        SetRefreshTokenCookie(newRefreshTokenString);

        _logger.LogInformation("Admin token refreshed for user: {UserId}", refreshToken.UserId);

        return Ok(new AuthResponse
        {
            AccessToken = accessToken,
            Role = "admin",
            User = new UserInfo
            {
                Id = refreshToken.User.Id,
                Email = refreshToken.User.Email ?? "",
                DisplayName = refreshToken.User.DisplayName
            }
        });
    }

    /// <summary>
    /// Admin logout endpoint.
    /// Revokes refresh token and clears cookie.
    /// </summary>
    [HttpPost("admin/logout")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> AdminLogout()
    {
        var refreshTokenString = Request.Cookies["refreshToken"];

        if (!string.IsNullOrEmpty(refreshTokenString))
        {
            var refreshToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == refreshTokenString);

            if (refreshToken != null && refreshToken.IsActive)
            {
                refreshToken.RevokedAt = DateTime.UtcNow;
                refreshToken.RevocationReason = "Logout";
                await _context.SaveChangesAsync();
            }
        }

        // Clear refresh token cookie
        Response.Cookies.Delete("refreshToken");

        _logger.LogInformation("Admin user logged out");

        return Ok(new { message = "Logged out successfully" });
    }

    /// <summary>
    /// Validate current authentication status.
    /// Returns user info if authenticated.
    /// </summary>
    [HttpGet("status")]
    [Authorize]
    public async Task<ActionResult<AuthResponse>> GetAuthStatus()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var roleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(roleClaim))
        {
            return Unauthorized();
        }

        if (roleClaim == "admin" && int.TryParse(userIdClaim, out var userId))
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return Unauthorized();
            }

            return Ok(new AuthResponse
            {
                AccessToken = "", // Not needed for status check
                Role = "admin",
                User = new UserInfo
                {
                    Id = user.Id,
                    Email = user.Email ?? "",
                    DisplayName = user.DisplayName
                }
            });
        }
        else if (roleClaim == "kiosk")
        {
            return Ok(new AuthResponse
            {
                AccessToken = "",
                Role = "kiosk",
                User = null
            });
        }

        return Unauthorized();
    }

    /// <summary>
    /// Kiosk authentication endpoint.
    /// Validates kiosk token and returns access token.
    /// </summary>
    [HttpPost("kiosk/authenticate")]
    public async Task<ActionResult<AuthResponse>> KioskAuthenticate([FromBody] KioskAuthRequest request)
    {
        var kioskToken = await _context.KioskTokens
            .FirstOrDefaultAsync(kt => kt.Token == request.Token);

        if (kioskToken == null || !kioskToken.IsActive)
        {
            _logger.LogWarning("Kiosk authentication attempt with invalid token");
            return Unauthorized(new { message = "Invalid kiosk token" });
        }

        // Generate JWT access token for kiosk
        var accessToken = _tokenService.GenerateKioskAccessToken(kioskToken.Id.ToString());

        _logger.LogInformation("Kiosk authenticated: {Name}", kioskToken.Name);

        return Ok(new AuthResponse
        {
            AccessToken = accessToken,
            Role = "kiosk",
            User = null
        });
    }

    /// <summary>
    /// Create a new kiosk token (admin only).
    /// </summary>
    [HttpPost("kiosk/tokens")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<KioskTokenResponse>> CreateKioskToken([FromBody] CreateKioskTokenRequest request)
    {
        var tokenString = _tokenService.GenerateKioskTokenString();

        var kioskToken = new KioskToken
        {
            Token = tokenString,
            Name = request.Name,
            CreatedAt = DateTime.UtcNow
        };

        _context.KioskTokens.Add(kioskToken);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Kiosk token created: {Name}", request.Name);

        return Ok(new KioskTokenResponse
        {
            Id = kioskToken.Id,
            Token = kioskToken.Token,
            Name = kioskToken.Name,
            CreatedAt = kioskToken.CreatedAt
        });
    }

    /// <summary>
    /// List all kiosk tokens (admin only).
    /// </summary>
    [HttpGet("kiosk/tokens")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<List<KioskTokenListItem>>> ListKioskTokens()
    {
        var tokens = await _context.KioskTokens
            .OrderByDescending(kt => kt.CreatedAt)
            .Select(kt => new KioskTokenListItem
            {
                Id = kt.Id,
                Name = kt.Name,
                CreatedAt = kt.CreatedAt,
                IsActive = kt.RevokedAt == null
            })
            .ToListAsync();

        return Ok(tokens);
    }

    /// <summary>
    /// Revoke a kiosk token (admin only).
    /// </summary>
    [HttpDelete("kiosk/tokens/{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> RevokeKioskToken(int id)
    {
        var kioskToken = await _context.KioskTokens.FindAsync(id);

        if (kioskToken == null)
        {
            return NotFound();
        }

        if (!kioskToken.IsActive)
        {
            return BadRequest(new { message = "Token already revoked" });
        }

        kioskToken.RevokedAt = DateTime.UtcNow;
        kioskToken.RevocationReason = "Admin revoked";
        await _context.SaveChangesAsync();

        _logger.LogInformation("Kiosk token revoked: {Name}", kioskToken.Name);

        return Ok(new { message = "Token revoked successfully" });
    }

    // ---- Device pairing ("login via mobile" QR flow) ----
    //
    // 1. TV calls POST device/start, gets a secret deviceCode + a userCode, and
    //    shows a QR pointing at {frontend}/pair?code={userCode}.
    // 2. Admin opens that URL on their phone, logs in (admin auth), and calls
    //    POST device/approve, which mints a kiosk token for the pairing.
    // 3. TV polls POST device/poll with its deviceCode and, once approved, receives
    //    the kiosk token + an access token (one time), then is fully authenticated.

    private const int PairingTtlMinutes = 10;
    private const int PairingPollIntervalSeconds = 3;

    /// <summary>
    /// Start a device pairing session (called by the TV/kiosk device). Anonymous.
    /// </summary>
    [HttpPost("device/start")]
    public async Task<ActionResult<DeviceStartResponse>> DeviceStart()
    {
        // Opportunistically drop stale pairings so the table stays small.
        var cutoff = DateTime.UtcNow.AddHours(-1);
        var stale = await _context.DevicePairings
            .Where(p => p.ExpiresAt < cutoff)
            .ToListAsync();
        if (stale.Count > 0)
        {
            _context.DevicePairings.RemoveRange(stale);
        }

        var pairing = new DevicePairing
        {
            DeviceCode = _tokenService.GenerateKioskTokenString(),
            UserCode = _tokenService.GenerateDeviceUserCode(),
            Status = DevicePairingStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(PairingTtlMinutes)
        };

        _context.DevicePairings.Add(pairing);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Device pairing started: {UserCode}", pairing.UserCode);

        return Ok(new DeviceStartResponse
        {
            DeviceCode = pairing.DeviceCode,
            UserCode = pairing.UserCode,
            ExpiresInSeconds = PairingTtlMinutes * 60,
            IntervalSeconds = PairingPollIntervalSeconds
        });
    }

    /// <summary>
    /// Poll a pairing session for approval (called by the device). Anonymous.
    /// Knowledge of the high-entropy device code is the only thing required.
    /// </summary>
    [HttpPost("device/poll")]
    public async Task<ActionResult<DevicePollResponse>> DevicePoll([FromBody] DevicePollRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DeviceCode))
        {
            return BadRequest(new { message = "Device code is required" });
        }

        var pairing = await _context.DevicePairings
            .FirstOrDefaultAsync(p => p.DeviceCode == request.DeviceCode);

        if (pairing == null)
        {
            return NotFound(new { message = "Unknown device code" });
        }

        // Approved: hand over the kiosk token + a fresh access token, exactly once.
        if (pairing.Status == DevicePairingStatus.Approved && pairing.KioskTokenId.HasValue)
        {
            var kioskToken = await _context.KioskTokens.FindAsync(pairing.KioskTokenId.Value);

            if (kioskToken == null || !kioskToken.IsActive)
            {
                // Token was revoked/deleted before collection — treat as expired.
                pairing.Status = DevicePairingStatus.Expired;
                await _context.SaveChangesAsync();
                return Ok(new DevicePollResponse { Status = DevicePairingStatus.Expired });
            }

            var accessToken = _tokenService.GenerateKioskAccessToken(kioskToken.Id.ToString());
            pairing.Status = DevicePairingStatus.Consumed;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Device pairing consumed: {UserCode}", pairing.UserCode);

            return Ok(new DevicePollResponse
            {
                Status = DevicePairingStatus.Approved,
                KioskToken = kioskToken.Token,
                AccessToken = accessToken
            });
        }

        // Still pending but past its TTL.
        if (pairing.Status == DevicePairingStatus.Pending && pairing.ExpiresAt < DateTime.UtcNow)
        {
            pairing.Status = DevicePairingStatus.Expired;
            await _context.SaveChangesAsync();
            return Ok(new DevicePollResponse { Status = DevicePairingStatus.Expired });
        }

        if (pairing.Status == DevicePairingStatus.Pending)
        {
            return Ok(new DevicePollResponse { Status = DevicePairingStatus.Pending });
        }

        // Consumed or expired — tell the device to stop polling.
        return Ok(new DevicePollResponse { Status = DevicePairingStatus.Expired });
    }

    /// <summary>
    /// Look up a pairing by user code so the /pair page can show its state. Anonymous.
    /// </summary>
    [HttpGet("device/info")]
    public async Task<ActionResult<DeviceInfoResponse>> DeviceInfo([FromQuery] string userCode)
    {
        if (string.IsNullOrWhiteSpace(userCode))
        {
            return Ok(new DeviceInfoResponse { Found = false, Status = "unknown" });
        }

        var pairing = await _context.DevicePairings
            .FirstOrDefaultAsync(p => p.UserCode == userCode);

        if (pairing == null)
        {
            return Ok(new DeviceInfoResponse { Found = false, Status = "unknown" });
        }

        var status = pairing.Status;
        if (status == DevicePairingStatus.Pending && pairing.ExpiresAt < DateTime.UtcNow)
        {
            status = DevicePairingStatus.Expired;
        }

        return Ok(new DeviceInfoResponse { Found = true, Status = status });
    }

    /// <summary>
    /// Approve a pairing and mint a kiosk token for the device (admin only).
    /// </summary>
    [HttpPost("device/approve")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeviceApprove([FromBody] DeviceApproveRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserCode))
        {
            return BadRequest(new { message = "User code is required" });
        }

        var pairing = await _context.DevicePairings
            .FirstOrDefaultAsync(p => p.UserCode == request.UserCode);

        if (pairing == null)
        {
            return NotFound(new { message = "Pairing not found" });
        }

        if (pairing.Status != DevicePairingStatus.Pending)
        {
            return BadRequest(new { message = "This pairing has already been used or is no longer valid" });
        }

        if (pairing.ExpiresAt < DateTime.UtcNow)
        {
            pairing.Status = DevicePairingStatus.Expired;
            await _context.SaveChangesAsync();
            return BadRequest(new { message = "This pairing code has expired. Please restart pairing on the TV." });
        }

        // Mint a long-lived kiosk token the device will collect on its next poll.
        var kioskToken = new KioskToken
        {
            Token = _tokenService.GenerateKioskTokenString(),
            Name = $"TV (paired {DateTime.UtcNow:yyyy-MM-dd})",
            CreatedAt = DateTime.UtcNow
        };
        _context.KioskTokens.Add(kioskToken);
        await _context.SaveChangesAsync();

        pairing.KioskTokenId = kioskToken.Id;
        pairing.Status = DevicePairingStatus.Approved;
        pairing.ApprovedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Device pairing approved: {UserCode} -> kiosk token {TokenId}", pairing.UserCode, kioskToken.Id);

        return Ok(new { message = "TV connected successfully" });
    }

    /// <summary>
    /// Helper method to set refresh token cookie with security settings.
    /// </summary>
    private void SetRefreshTokenCookie(string token)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true, // Prevents XSS attacks
            Secure = _env.IsProduction(), // HTTPS only in production, allow HTTP in development
            SameSite = SameSiteMode.Lax, // CSRF protection
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        };

        Response.Cookies.Append("refreshToken", token, cookieOptions);
    }
}
