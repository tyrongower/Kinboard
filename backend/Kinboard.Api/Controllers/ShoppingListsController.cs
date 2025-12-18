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
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error retrieving shopping lists");
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving shopping lists");
            return StatusCode(500, new { message = "An unexpected error occurred" });
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
                return NotFound(new { message = "Shopping list not found" });
            }
            _logger.LogInformation("Retrieved shopping list ID: {Id}", id);
            return list;
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error retrieving shopping list ID: {Id}", id);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving shopping list ID: {Id}", id);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ShoppingList>> Create(ShoppingList list)
    {
        try
        {
            _logger.LogDebug("Creating shopping list: {Name}", list.Name);

            if (string.IsNullOrWhiteSpace(list.Name))
            {
                _logger.LogWarning("Shopping list creation failed: name is required");
                return BadRequest(new { message = "Shopping list name is required" });
            }

            // Basic normalization: ensure color starts with '#'
            if (!string.IsNullOrWhiteSpace(list.ColorHex) && !list.ColorHex.StartsWith('#'))
            {
                list.ColorHex = "#" + list.ColorHex.Trim();
            }

            _context.ShoppingLists.Add(list);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Shopping list created successfully with ID: {Id}, Name: {Name}", list.Id, list.Name);
            return CreatedAtAction(nameof(GetById), new { id = list.Id }, list);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error creating shopping list: {Name}", list.Name);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating shopping list: {Name}", list.Name);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ShoppingList list)
    {
        try
        {
            _logger.LogDebug("Updating shopping list ID: {Id}", id);

            if (id != list.Id)
            {
                _logger.LogWarning("Shopping list ID mismatch: URL ID {UrlId} vs Body ID {BodyId}", id, list.Id);
                return BadRequest(new { message = "ID mismatch" });
            }

            if (string.IsNullOrWhiteSpace(list.Name))
            {
                _logger.LogWarning("Shopping list update failed: name is required for ID {Id}", id);
                return BadRequest(new { message = "Shopping list name is required" });
            }

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
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating shopping list ID: {Id}", id);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Bulk update display order. Body is array of list IDs in desired order.
    /// </summary>
    [HttpPut("order")]
    public async Task<IActionResult> UpdateOrder([FromBody] int[] orderedIds)
    {
        try
        {
            _logger.LogDebug("Updating shopping list order for {Count} items", orderedIds?.Length ?? 0);

            if (orderedIds == null || orderedIds.Length == 0)
            {
                _logger.LogWarning("Update order called with no IDs");
                return BadRequest(new { message = "No list ids provided" });
            }

            var lists = await _context.ShoppingLists.Where(l => orderedIds.Contains(l.Id)).ToListAsync();
            var indexById = orderedIds.Select((id, idx) => (id, idx)).ToDictionary(x => x.id, x => x.idx);
            foreach (var l in lists)
            {
                l.DisplayOrder = indexById.TryGetValue(l.Id, out var idx) ? idx : l.DisplayOrder;
            }
            await _context.SaveChangesAsync();
            _logger.LogInformation("Shopping list order updated successfully for {Count} items", lists.Count);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error updating shopping list order");
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating shopping list order");
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
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
            _logger.LogDebug("Uploading avatar for shopping list ID: {Id}", id);

            var list = await _context.ShoppingLists.FindAsync(id);
            if (list == null)
            {
                _logger.LogWarning("Shopping list ID {Id} not found for avatar upload", id);
                return NotFound(new { message = "Shopping list not found" });
            }

            if (file == null || file.Length == 0)
            {
                _logger.LogWarning("Avatar upload failed for shopping list ID {Id}: no file provided", id);
                return BadRequest(new { message = "No file uploaded" });
            }

            if (file.Length > MaxAvatarBytes)
            {
                _logger.LogWarning("Avatar upload failed for shopping list ID {Id}: file too large ({Size} bytes)", id, file.Length);
                return BadRequest(new { message = $"Max file size is {MaxAvatarBytes / (1024 * 1024)} MB" });
            }

            await using var inStream = file.OpenReadStream();
            Image image;
            try
            {
                image = await Image.LoadAsync(inStream);
            }
            catch
            {
                _logger.LogWarning("Avatar upload failed for shopping list ID {Id}: invalid image file", id);
                return BadRequest(new { message = "Invalid image file" });
            }

            if (image.Width < MinDimension || image.Height < MinDimension || image.Width > MaxDimension || image.Height > MaxDimension)
            {
                image.Dispose();
                _logger.LogWarning("Avatar upload failed for shopping list ID {Id}: image dimensions {Width}x{Height} out of range", id, image.Width, image.Height);
                return BadRequest(new { message = $"Image dimensions out of range ({MinDimension}-{MaxDimension}px)" });
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
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error uploading avatar for shopping list ID: {Id}", id);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error uploading avatar for shopping list ID: {Id}", id);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Delete avatar for a shopping list
    /// </summary>
    [HttpDelete("{id}/avatar")]
    public async Task<IActionResult> DeleteAvatar(int id)
    {
        try
        {
            _logger.LogDebug("Deleting avatar for shopping list ID: {Id}", id);

            var list = await _context.ShoppingLists.FindAsync(id);
            if (list == null)
            {
                _logger.LogWarning("Shopping list ID {Id} not found for avatar deletion", id);
                return NotFound(new { message = "Shopping list not found" });
            }

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
            catch (Exception fileEx)
            {
                _logger.LogWarning(fileEx, "Failed to delete avatar file for shopping list ID: {Id}", id);
                // Continue with database update even if file deletion fails
            }

            list.AvatarUrl = null;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Avatar deleted successfully for shopping list ID: {Id}", id);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error deleting avatar for shopping list ID: {Id}", id);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting avatar for shopping list ID: {Id}", id);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            _logger.LogDebug("Deleting shopping list ID: {Id}", id);

            var list = await _context.ShoppingLists.FindAsync(id);
            if (list == null)
            {
                _logger.LogWarning("Shopping list ID {Id} not found for deletion", id);
                return NotFound(new { message = "Shopping list not found" });
            }

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
            catch (Exception fileEx)
            {
                _logger.LogWarning(fileEx, "Failed to delete avatar file for shopping list ID: {Id}", id);
                // Continue with database deletion even if file deletion fails
            }

            _context.ShoppingLists.Remove(list);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Shopping list ID {Id} deleted successfully", id);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error deleting shopping list ID: {Id}", id);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting shopping list ID: {Id}", id);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }
}
