using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kinboard.Api.Data;
using Kinboard.Api.Models;
using BCrypt.Net;

namespace Kinboard.Api.Controllers;

/// <summary>
/// Setup controller for initial system configuration.
/// This endpoint should be called once to create the initial admin user.
/// For production, consider removing this controller or protecting it with environment checks.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SetupController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<SetupController> _logger;

    public SetupController(AppDbContext context, ILogger<SetupController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Creates an initial admin user if no admin users exist.
    /// Can either create a new user or promote an existing user to admin.
    /// </summary>
    [HttpPost("init-admin")]
    public async Task<IActionResult> InitializeAdmin([FromBody] InitAdminRequest request)
    {
        try
        {
            _logger.LogDebug("Initializing admin user");

            // Check if any admin users already exist
            var adminExists = await _context.Users.AnyAsync(u => u.IsAdmin);

            if (adminExists)
            {
                _logger.LogWarning("Admin user already exists, rejecting init-admin request");
                return BadRequest(new { message = "Admin user already exists. Use admin panel to manage users." });
            }

            // Validate request
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                _logger.LogWarning("Admin initialization failed: email and password are required");
                return BadRequest(new { message = "Email and password are required" });
            }

            if (request.Password.Length < 8)
            {
                _logger.LogWarning("Admin initialization failed: password too short");
                return BadRequest(new { message = "Password must be at least 8 characters long" });
            }

            // Hash password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            User adminUser;

            if (request.UserId.HasValue)
            {
                // Update existing user to be admin
                adminUser = await _context.Users.FindAsync(request.UserId.Value);

                if (adminUser == null)
                {
                    _logger.LogWarning("Admin initialization failed: user ID {UserId} not found", request.UserId.Value);
                    return NotFound(new { message = "User not found" });
                }

                if (adminUser.IsAdmin)
                {
                    _logger.LogWarning("Admin initialization failed: user ID {UserId} is already an admin", request.UserId.Value);
                    return BadRequest(new { message = "User is already an admin" });
                }

                // Promote existing user to admin
                adminUser.Email = request.Email;
                adminUser.PasswordHash = passwordHash;
                adminUser.IsAdmin = true;

                _logger.LogInformation("Existing user promoted to admin: {DisplayName} ({Email})", adminUser.DisplayName, request.Email);
            }
            else
            {
                // Create new admin user
                if (string.IsNullOrWhiteSpace(request.DisplayName))
                {
                    _logger.LogWarning("Admin initialization failed: display name is required for new users");
                    return BadRequest(new { message = "Display name is required for new users" });
                }

                adminUser = new User
                {
                    Email = request.Email,
                    DisplayName = request.DisplayName,
                    PasswordHash = passwordHash,
                    IsAdmin = true,
                    ColorHex = "#4F46E5", // Default admin color
                    DisplayOrder = 0
                };

                _context.Users.Add(adminUser);
                _logger.LogInformation("New admin user created: {Email}", adminUser.Email);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Admin user created successfully",
                userId = adminUser.Id,
                email = adminUser.Email
            });
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error initializing admin user");
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error initializing admin user");
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Check if setup is required (no admin users exist).
    /// Returns information about existing users if any exist.
    /// </summary>
    [HttpGet("status")]
    public async Task<IActionResult> GetSetupStatus()
    {
        try
        {
            _logger.LogDebug("Checking setup status");

            var adminExists = await _context.Users.AnyAsync(u => u.IsAdmin);
            var hasUsers = await _context.Users.AnyAsync();
            var users = hasUsers ? await _context.Users
                .Select(u => new { u.Id, u.DisplayName })
                .ToListAsync() : null;

            _logger.LogInformation("Setup status: adminExists={AdminExists}, hasUsers={HasUsers}", adminExists, hasUsers);

            return Ok(new
            {
                setupRequired = !adminExists,
                hasUsers,
                users
            });
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error checking setup status");
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error checking setup status");
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }
}

public class InitAdminRequest
{
    public int? UserId { get; set; } // Optional: If provided, promote existing user to admin
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty; // Required only for new users
}
