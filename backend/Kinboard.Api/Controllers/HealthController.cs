using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kinboard.Api.Data;

namespace Kinboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<HealthController> _logger;

    public HealthController(AppDbContext db, ILogger<HealthController> logger)
    {
        _db = db;
        _logger = logger;
    }

    // GET: /api/health
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        bool canConnect;
        string? provider = null;
        string? error = null;

        try
        {
            _logger.LogDebug("Health check: Testing database connection");
            provider = _db.Database.ProviderName;
            canConnect = await _db.Database.CanConnectAsync(ct);
            _logger.LogInformation("Health check: Database connection status = {CanConnect}, Provider = {Provider}", canConnect, provider);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check: Database connection failed");
            canConnect = false;
            error = ex.Message;
        }

        var payload = new
        {
            status = canConnect ? "Healthy" : "Unhealthy",
            database = new
            {
                ok = canConnect,
                provider,
                error
            },
            timeUtc = DateTime.UtcNow
        };

        if (canConnect)
        {
            return Ok(payload);
        }
        else
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, payload);
        }
    }
}
