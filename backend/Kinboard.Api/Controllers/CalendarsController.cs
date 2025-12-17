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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all calendar sources");
            throw;
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CalendarSource>> Get(int id)
    {
        var entity = await _context.CalendarSources.FindAsync(id);
        if (entity == null) return NotFound();
        return entity;
    }

    [HttpPost]
    [Authorize(Roles = "admin")] // Admin only
    public async Task<ActionResult<CalendarSource>> Create(CalendarSource source)
    {
        try
        {
            _logger.LogInformation("Creating calendar source: {Name}", source.Name);
            NormalizeColor(source);
            _context.CalendarSources.Add(source);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Calendar source created successfully with ID: {Id}", source.Id);
            return CreatedAtAction(nameof(Get), new { id = source.Id }, source);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating calendar source: {Name}", source.Name);
            throw;
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")] // Admin only
    public async Task<IActionResult> Update(int id, CalendarSource source)
    {
        if (id != source.Id) return BadRequest();
        try
        {
            _logger.LogInformation("Updating calendar source ID: {Id}", id);
            NormalizeColor(source);
            _context.Entry(source).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Calendar source ID {Id} updated successfully", id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating calendar source ID: {Id}", id);
            throw;
        }
    }

    [HttpPut("order")]
    [Authorize(Roles = "admin")] // Admin only
    public async Task<IActionResult> UpdateOrder([FromBody] int[] orderedIds)
    {
        if (orderedIds == null || orderedIds.Length == 0) return BadRequest("No ids provided");
        try
        {
            _logger.LogInformation("Updating calendar source order for {Count} items", orderedIds.Length);
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating calendar source order");
            throw;
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")] // Admin only
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            _logger.LogInformation("Deleting calendar source ID: {Id}", id);
            var entity = await _context.CalendarSources.FindAsync(id);
            if (entity == null)
            {
                _logger.LogWarning("Calendar source ID {Id} not found for deletion", id);
                return NotFound();
            }
            _context.CalendarSources.Remove(entity);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Calendar source ID {Id} deleted successfully", id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting calendar source ID: {Id}", id);
            throw;
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
