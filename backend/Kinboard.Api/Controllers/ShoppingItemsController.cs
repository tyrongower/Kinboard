using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kinboard.Api.Data;
using Kinboard.Api.Models;

namespace Kinboard.Api.Controllers;

[ApiController]
[Route("api/shoppinglists/{listId}/items")]
[Authorize] // Require authentication (admin + kiosk)
public class ShoppingItemsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ShoppingItemsController> _logger;

    public ShoppingItemsController(AppDbContext context, ILogger<ShoppingItemsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShoppingItem>>> GetAll(int listId)
    {
        try
        {
            _logger.LogDebug("Fetching shopping items for list ID: {ListId}", listId);

            var listExists = await _context.ShoppingLists.AnyAsync(l => l.Id == listId);
            if (!listExists)
            {
                _logger.LogWarning("Shopping list ID {ListId} not found", listId);
                return NotFound(new { message = "Shopping list not found" });
            }

            var items = await _context.ShoppingItems
                .AsNoTracking()
                .Where(i => i.ShoppingListId == listId)
                .OrderBy(i => i.DisplayOrder)
                .ThenBy(i => i.CreatedAt)
                .ToListAsync();
            _logger.LogInformation("Retrieved {Count} items for list ID: {ListId}", items.Count, listId);
            return items;
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error retrieving items for list ID: {ListId}", listId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving items for list ID: {ListId}", listId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ShoppingItem>> GetById(int listId, int id)
    {
        try
        {
            _logger.LogDebug("Fetching shopping item ID: {Id} for list ID: {ListId}", id, listId);

            var item = await _context.ShoppingItems
                .FirstOrDefaultAsync(i => i.Id == id && i.ShoppingListId == listId);
            if (item == null)
            {
                _logger.LogWarning("Shopping item ID {Id} not found for list ID: {ListId}", id, listId);
                return NotFound(new { message = "Shopping item not found" });
            }
            _logger.LogInformation("Retrieved shopping item ID: {Id} for list ID: {ListId}", id, listId);
            return item;
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error retrieving item ID: {Id} for list ID: {ListId}", id, listId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving item ID: {Id} for list ID: {ListId}", id, listId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ShoppingItem>> Create(int listId, ShoppingItem item)
    {
        try
        {
            _logger.LogDebug("Creating shopping item '{Name}' in list ID: {ListId}", item.Name, listId);

            if (string.IsNullOrWhiteSpace(item.Name))
            {
                _logger.LogWarning("Shopping item creation failed: name is required for list ID: {ListId}", listId);
                return BadRequest(new { message = "Shopping item name is required" });
            }

            var listExists = await _context.ShoppingLists.AnyAsync(l => l.Id == listId);
            if (!listExists)
            {
                _logger.LogWarning("Shopping list ID {ListId} not found for item creation", listId);
                return NotFound(new { message = "Shopping list not found" });
            }

            item.ShoppingListId = listId;
            item.CreatedAt = DateTime.UtcNow;

            // Set display order to end of list if not specified
            if (item.DisplayOrder == 0)
            {
                var maxOrder = await _context.ShoppingItems
                    .Where(i => i.ShoppingListId == listId)
                    .MaxAsync(i => (int?)i.DisplayOrder) ?? -1;
                item.DisplayOrder = maxOrder + 1;
            }

            _context.ShoppingItems.Add(item);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Created item ID: {Id} '{Name}' in list ID: {ListId}", item.Id, item.Name, listId);
            return CreatedAtAction(nameof(GetById), new { listId, id = item.Id }, item);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error creating item in list ID: {ListId}", listId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating item in list ID: {ListId}", listId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int listId, int id, ShoppingItem item)
    {
        try
        {
            _logger.LogDebug("Updating shopping item ID: {Id} in list ID: {ListId}", id, listId);

            if (id != item.Id)
            {
                _logger.LogWarning("Shopping item ID mismatch: URL ID {UrlId} vs Body ID {BodyId}", id, item.Id);
                return BadRequest(new { message = "ID mismatch" });
            }

            if (listId != item.ShoppingListId)
            {
                _logger.LogWarning("Shopping list ID mismatch for item ID {Id}: URL list {UrlListId} vs Body list {BodyListId}", id, listId, item.ShoppingListId);
                return BadRequest(new { message = "List ID mismatch" });
            }

            if (string.IsNullOrWhiteSpace(item.Name))
            {
                _logger.LogWarning("Shopping item update failed: name is required for item ID: {Id}", id);
                return BadRequest(new { message = "Shopping item name is required" });
            }

            _context.Entry(item).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Updated item ID: {Id} in list ID: {ListId}", id, listId);
            return NoContent();
        }
        catch (DbUpdateConcurrencyException ex)
        {
            if (!await _context.ShoppingItems.AnyAsync(i => i.Id == id))
            {
                _logger.LogWarning("Shopping item ID {Id} not found during update", id);
                return NotFound(new { message = "Shopping item not found" });
            }
            _logger.LogError(ex, "Concurrency error updating item ID: {Id} in list ID: {ListId}", id, listId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error updating item ID: {Id} in list ID: {ListId}", id, listId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating item ID: {Id} in list ID: {ListId}", id, listId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Toggle the bought status of an item
    /// </summary>
    [HttpPost("{id}/toggle")]
    public async Task<ActionResult<ShoppingItem>> ToggleBought(int listId, int id)
    {
        try
        {
            _logger.LogDebug("Toggling bought status for item ID: {Id} in list ID: {ListId}", id, listId);

            var item = await _context.ShoppingItems
                .FirstOrDefaultAsync(i => i.Id == id && i.ShoppingListId == listId);
            if (item == null)
            {
                _logger.LogWarning("Shopping item ID {Id} not found in list ID: {ListId}", id, listId);
                return NotFound(new { message = "Shopping item not found" });
            }

            item.IsBought = !item.IsBought;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Toggled bought status for item ID: {Id} to {IsBought}", id, item.IsBought);
            return item;
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error toggling item ID: {Id} in list ID: {ListId}", id, listId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error toggling item ID: {Id} in list ID: {ListId}", id, listId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Toggle the important flag of an item
    /// </summary>
    [HttpPost("{id}/important")]
    public async Task<ActionResult<ShoppingItem>> ToggleImportant(int listId, int id)
    {
        try
        {
            _logger.LogDebug("Toggling important status for item ID: {Id} in list ID: {ListId}", id, listId);

            var item = await _context.ShoppingItems
                .FirstOrDefaultAsync(i => i.Id == id && i.ShoppingListId == listId);
            if (item == null)
            {
                _logger.LogWarning("Shopping item ID {Id} not found in list ID: {ListId}", id, listId);
                return NotFound(new { message = "Shopping item not found" });
            }

            item.IsImportant = !item.IsImportant;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Toggled important status for item ID: {Id} to {IsImportant}", id, item.IsImportant);
            return item;
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error toggling important for item ID: {Id} in list ID: {ListId}", id, listId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error toggling important for item ID: {Id} in list ID: {ListId}", id, listId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Bulk update display order. Body is array of item IDs in desired order.
    /// </summary>
    [HttpPut("order")]
    public async Task<IActionResult> UpdateOrder(int listId, [FromBody] int[] orderedIds)
    {
        try
        {
            _logger.LogDebug("Updating shopping item order for list ID: {ListId}, {Count} items", listId, orderedIds?.Length ?? 0);

            if (orderedIds == null || orderedIds.Length == 0)
            {
                _logger.LogWarning("Update order called with no IDs for list ID: {ListId}", listId);
                return BadRequest(new { message = "No item ids provided" });
            }

            var items = await _context.ShoppingItems
                .Where(i => i.ShoppingListId == listId && orderedIds.Contains(i.Id))
                .ToListAsync();
            var indexById = orderedIds.Select((id, idx) => (id, idx)).ToDictionary(x => x.id, x => x.idx);
            foreach (var item in items)
            {
                item.DisplayOrder = indexById.TryGetValue(item.Id, out var idx) ? idx : item.DisplayOrder;
            }
            await _context.SaveChangesAsync();
            _logger.LogInformation("Updated order for {Count} items in list ID: {ListId}", items.Count, listId);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error updating item order for list ID: {ListId}", listId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating item order for list ID: {ListId}", listId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Clear all bought items from a list
    /// </summary>
    [HttpDelete("bought")]
    public async Task<IActionResult> ClearBought(int listId)
    {
        try
        {
            _logger.LogDebug("Clearing bought items from list ID: {ListId}", listId);

            var boughtItems = await _context.ShoppingItems
                .Where(i => i.ShoppingListId == listId && i.IsBought)
                .ToListAsync();

            _context.ShoppingItems.RemoveRange(boughtItems);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Cleared {Count} bought items from list ID: {ListId}", boughtItems.Count, listId);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error clearing bought items from list ID: {ListId}", listId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error clearing bought items from list ID: {ListId}", listId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int listId, int id)
    {
        try
        {
            _logger.LogDebug("Deleting shopping item ID: {Id} from list ID: {ListId}", id, listId);

            var item = await _context.ShoppingItems
                .FirstOrDefaultAsync(i => i.Id == id && i.ShoppingListId == listId);
            if (item == null)
            {
                _logger.LogWarning("Shopping item ID {Id} not found in list ID: {ListId}", id, listId);
                return NotFound(new { message = "Shopping item not found" });
            }

            _context.ShoppingItems.Remove(item);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Deleted item ID: {Id} from list ID: {ListId}", id, listId);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error deleting item ID: {Id} from list ID: {ListId}", id, listId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting item ID: {Id} from list ID: {ListId}", id, listId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }
}
