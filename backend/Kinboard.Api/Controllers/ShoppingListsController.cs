using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kinboard.Api.Data;
using Kinboard.Api.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace Kinboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Require authentication (admin + kiosk)
public class ShoppingListsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ShoppingListsController> _logger;

    public ShoppingListsController(AppDbContext context, ILogger<ShoppingListsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private const int MaxAvatarBytes = 5_000_000; // 5 MB
    private const int MinDimension = 64;
    private const int MaxDimension = 5000;
    private const int OutputSize = 256;
    private static readonly WebpEncoder WebpEncoder = new WebpEncoder { Quality = 80 };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShoppingList>>> GetAll()
    {
        try
        {
            _logger.LogDebug("Fetching all shopping lists");
            var lists = await _context.ShoppingLists
                .AsNoTracking()
                .Include(l => l.Items.OrderBy(i => i.DisplayOrder))
                .OrderBy(l => l.DisplayOrder)
                .ThenBy(l => l.Name)
                .ToListAsync();
            _logger.LogInformation("Retrieved {Count} shopping lists", lists.Count);
            return lists;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving shopping lists");
            throw;
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ShoppingList>> GetById(int id)
    {
        try
        {
            _logger.LogDebug("Fetching shopping list ID: {Id}", id);
            var list = await _context.ShoppingLists
                .Include(l => l.Items.OrderBy(i => i.DisplayOrder))
                .FirstOrDefaultAsync(l => l.Id == id);
            if (list == null)
            {
                _logger.LogWarning("Shopping list ID {Id} not found", id);
                return NotFound();
            }
            return list;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving shopping list ID: {Id}", id);
            throw;
        }
    }

    [HttpPost]
    public async Task<ActionResult<ShoppingList>> Create(ShoppingList list)
    {
        try
        {
            _logger.LogInformation("Creating shopping list: {Name}", list.Name);
            // Basic normalization: ensure color starts with '#'
            if (!string.IsNullOrWhiteSpace(list.ColorHex) && !list.ColorHex.StartsWith('#'))
            {
                list.ColorHex = "#" + list.ColorHex.Trim();
            }

            _context.ShoppingLists.Add(list);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Shopping list created successfully with ID: {Id}", list.Id);
            return CreatedAtAction(nameof(GetById), new { id = list.Id }, list);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating shopping list: {Name}", list.Name);
            throw;
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ShoppingList list)
    {
        if (id != list.Id) return BadRequest();

        try
        {
            _logger.LogInformation("Updating shopping list ID: {Id}", id);
            if (!string.IsNullOrWhiteSpace(list.ColorHex) && !list.ColorHex.StartsWith('#'))
            {
                list.ColorHex = "#" + list.ColorHex.Trim();
            }

            _context.Entry(list).State = EntityState.Modified;
            // Don't update Items collection through this endpoint
            _context.Entry(list).Collection(l => l.Items).IsModified = false;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Shopping list ID {Id} updated successfully", id);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error updating shopping list ID: {Id}", id);
            return Problem(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating shopping list ID: {Id}", id);
            throw;
        }
    }

    /// <summary>
    /// Bulk update display order. Body is array of list IDs in desired order.
    /// </summary>
    [HttpPut("order")]
    public async Task<IActionResult> UpdateOrder([FromBody] int[] orderedIds)
    {
        if (orderedIds == null || orderedIds.Length == 0)
            return BadRequest("No list ids provided");

        var lists = await _context.ShoppingLists.Where(l => orderedIds.Contains(l.Id)).ToListAsync();
        var indexById = orderedIds.Select((id, idx) => (id, idx)).ToDictionary(x => x.id, x => x.idx);
        foreach (var l in lists)
        {
            l.DisplayOrder = indexById.TryGetValue(l.Id, out var idx) ? idx : l.DisplayOrder;
        }
        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Upload avatar image for a shopping list. Validates and processes to a 256x256 WebP at a stable path.
    /// </summary>
    [HttpPost("{id}/avatar")]
    [RequestSizeLimit(MaxAvatarBytes)]
    public async Task<IActionResult> UploadAvatar(int id, IFormFile file)
    {
        try
        {
            _logger.LogInformation("Uploading avatar for shopping list ID: {Id}", id);
            var list = await _context.ShoppingLists.FindAsync(id);
            if (list == null) return NotFound();
            if (file == null || file.Length == 0) return BadRequest("No file uploaded");
            if (file.Length > MaxAvatarBytes) return BadRequest($"Max file size is {MaxAvatarBytes / (1024 * 1024)} MB");

            await using var inStream = file.OpenReadStream();
            Image image;
            try
            {
                image = await Image.LoadAsync(inStream);
            }
            catch
            {
                return BadRequest("Invalid image file");
            }

            if (image.Width < MinDimension || image.Height < MinDimension || image.Width > MaxDimension || image.Height > MaxDimension)
            {
                image.Dispose();
                return BadRequest($"Image dimensions out of range ({MinDimension}-{MaxDimension}px)");
            }

            // Center-crop to square then resize
            int side = Math.Min(image.Width, image.Height);
            var rect = new Rectangle((image.Width - side) / 2, (image.Height - side) / 2, side, side);
            image.Mutate(x => x.Crop(rect).Resize(OutputSize, OutputSize));

            var avatarsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");
            Directory.CreateDirectory(avatarsRoot);
            var fileName = $"shoppinglist_{id}.webp";
            var fullPath = Path.Combine(avatarsRoot, fileName);
            await using (var outStream = System.IO.File.Create(fullPath))
            {
                await image.SaveAsWebpAsync(outStream, WebpEncoder);
            }
            image.Dispose();

            list.AvatarUrl = $"/avatars/{fileName}";
            await _context.SaveChangesAsync();
            var cacheBusted = list.AvatarUrl + $"?v={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
            _logger.LogInformation("Avatar uploaded successfully for shopping list ID: {Id}", id);
            return Ok(new { avatarUrl = cacheBusted });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading avatar for shopping list ID: {Id}", id);
            throw;
        }
    }

    /// <summary>
    /// Delete avatar for a shopping list
    /// </summary>
    [HttpDelete("{id}/avatar")]
    public async Task<IActionResult> DeleteAvatar(int id)
    {
        var list = await _context.ShoppingLists.FindAsync(id);
        if (list == null) return NotFound();
        
        // Delete avatar file
        try
        {
            if (!string.IsNullOrWhiteSpace(list.AvatarUrl))
            {
                var path = list.AvatarUrl.Split('?')[0].Replace('/', Path.DirectorySeparatorChar);
                var full = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", path.TrimStart(Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(full)) System.IO.File.Delete(full);
            }
        }
        catch { /* ignore file delete errors */ }
        
        list.AvatarUrl = null;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var list = await _context.ShoppingLists.FindAsync(id);
        if (list == null) return NotFound();
        
        // Try delete avatar file
        try
        {
            if (!string.IsNullOrWhiteSpace(list.AvatarUrl))
            {
                var path = list.AvatarUrl.Split('?')[0].Replace('/', Path.DirectorySeparatorChar);
                var full = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", path.TrimStart(Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(full)) System.IO.File.Delete(full);
            }
        }
        catch { /* ignore file delete errors */ }
        
        _context.ShoppingLists.Remove(list);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
