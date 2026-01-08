using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kinboard.Api.Data;
using Kinboard.Api.Models;
using Kinboard.Api.Dtos;

namespace Kinboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Require authentication
public class CalendarsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<CalendarsController> _logger;

    public CalendarsController(AppDbContext context, ILogger<CalendarsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        try
        {
            _logger.LogDebug("Fetching all calendar sources");
            var items = await _context.CalendarSources
                .AsNoTracking()
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.Name)
                .ToListAsync();
            _logger.LogInformation("Retrieved {Count} calendar sources", items.Count);

            // Return different data based on role - kiosk users don't need iCal URLs
            if (User.IsInRole("kiosk"))
            {
                var dtos = items.Select(c => new CalendarSourceDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    ColorHex = c.ColorHex,
                    Enabled = c.Enabled,
                    DisplayOrder = c.DisplayOrder
                }).ToList();
                return Ok(dtos);
            }

            // Admin users get full calendar sources including iCal URLs
            return Ok(items);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error retrieving calendar sources");
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving calendar sources");
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CalendarSource>> Get(int id)
    {
        try
        {
            _logger.LogDebug("Fetching calendar source ID: {Id}", id);
            var entity = await _context.CalendarSources.FindAsync(id);
            if (entity == null)
            {
                _logger.LogWarning("Calendar source ID {Id} not found", id);
                return NotFound(new { message = "Calendar source not found" });
            }
            return entity;
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error retrieving calendar source ID: {Id}", id);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving calendar source ID: {Id}", id);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "admin")] // Admin only
    public async Task<ActionResult<CalendarSource>> Create(CalendarSource source)
    {
        try
        {
            _logger.LogDebug("Creating calendar source: {Name}", source.Name);
            NormalizeColor(source);
            _context.CalendarSources.Add(source);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Calendar source created successfully with ID: {Id}", source.Id);
            return CreatedAtAction(nameof(Get), new { id = source.Id }, source);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error creating calendar source: {Name}", source.Name);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating calendar source: {Name}", source.Name);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")] // Admin only
    public async Task<IActionResult> Update(int id, CalendarSource source)
    {
        if (id != source.Id)
        {
            _logger.LogWarning("Calendar source ID mismatch: URL ID {UrlId} vs Body ID {BodyId}", id, source.Id);
            return BadRequest(new { message = "ID mismatch" });
        }
        try
        {
            _logger.LogDebug("Updating calendar source ID: {Id}", id);
            NormalizeColor(source);
            _context.Entry(source).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Calendar source ID {Id} updated successfully", id);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error updating calendar source ID: {Id}", id);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating calendar source ID: {Id}", id);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    [HttpPut("order")]
    [Authorize(Roles = "admin")] // Admin only
    public async Task<IActionResult> UpdateOrder([FromBody] int[] orderedIds)
    {
        if (orderedIds == null || orderedIds.Length == 0)
        {
            _logger.LogWarning("Update calendar order called with no IDs");
            return BadRequest(new { message = "No IDs provided" });
        }
        try
        {
            _logger.LogDebug("Updating calendar source order for {Count} items", orderedIds.Length);
            var items = await _context.CalendarSources.Where(c => orderedIds.Contains(c.Id)).ToListAsync();
            var indexById = orderedIds.Select((id, idx) => (id, idx)).ToDictionary(x => x.id, x => x.idx);
            foreach (var c in items)
            {
                c.DisplayOrder = indexById.TryGetValue(c.Id, out var idx) ? idx : c.DisplayOrder;
            }
            await _context.SaveChangesAsync();
            _logger.LogInformation("Calendar source order updated successfully");
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error updating calendar source order");
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating calendar source order");
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")] // Admin only
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            _logger.LogDebug("Deleting calendar source ID: {Id}", id);
            var entity = await _context.CalendarSources.FindAsync(id);
            if (entity == null)
            {
                _logger.LogWarning("Calendar source ID {Id} not found for deletion", id);
                return NotFound(new { message = "Calendar source not found" });
            }
            _context.CalendarSources.Remove(entity);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Calendar source ID {Id} deleted successfully", id);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error deleting calendar source ID: {Id}", id);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting calendar source ID: {Id}", id);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    private static void NormalizeColor(CalendarSource s)
    {
        if (!string.IsNullOrWhiteSpace(s.ColorHex) && !s.ColorHex.StartsWith('#'))
        {
            s.ColorHex = "#" + s.ColorHex.Trim();
        }
    }
}
