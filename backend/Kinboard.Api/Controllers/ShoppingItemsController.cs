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
            var listExists = await _context.ShoppingLists.AnyAsync(l => l.Id == listId);
            if (!listExists) return NotFound("Shopping list not found");

            var items = await _context.ShoppingItems
                .AsNoTracking()
                .Where(i => i.ShoppingListId == listId)
                .OrderBy(i => i.DisplayOrder)
                .ThenBy(i => i.CreatedAt)
                .ToListAsync();
            return items;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving items for list ID: {ListId}", listId);
            throw;
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ShoppingItem>> GetById(int listId, int id)
    {
        try
        {
            var item = await _context.ShoppingItems
                .FirstOrDefaultAsync(i => i.Id == id && i.ShoppingListId == listId);
            if (item == null) return NotFound();
            return item;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving item ID: {Id} for list ID: {ListId}", id, listId);
            throw;
        }
    }

    [HttpPost]
    public async Task<ActionResult<ShoppingItem>> Create(int listId, ShoppingItem item)
    {
        try
        {
            var listExists = await _context.ShoppingLists.AnyAsync(l => l.Id == listId);
            if (!listExists) return NotFound("Shopping list not found");

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
            _logger.LogInformation("Created item '{Name}' in list ID: {ListId}", item.Name, listId);
            return CreatedAtAction(nameof(GetById), new { listId, id = item.Id }, item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating item in list ID: {ListId}", listId);
            throw;
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int listId, int id, ShoppingItem item)
    {
        if (id != item.Id) return BadRequest();
        if (listId != item.ShoppingListId) return BadRequest();

        try
        {
            _context.Entry(item).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Updated item ID: {Id} in list ID: {ListId}", id, listId);
            return NoContent();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _context.ShoppingItems.AnyAsync(i => i.Id == id))
                return NotFound();
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating item ID: {Id} in list ID: {ListId}", id, listId);
            throw;
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
            var item = await _context.ShoppingItems
                .FirstOrDefaultAsync(i => i.Id == id && i.ShoppingListId == listId);
            if (item == null) return NotFound();

            item.IsBought = !item.IsBought;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Toggled bought status for item ID: {Id} to {IsBought}", id, item.IsBought);
            return item;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling item ID: {Id} in list ID: {ListId}", id, listId);
            throw;
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
            var item = await _context.ShoppingItems
                .FirstOrDefaultAsync(i => i.Id == id && i.ShoppingListId == listId);
            if (item == null) return NotFound();

            item.IsImportant = !item.IsImportant;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Toggled important status for item ID: {Id} to {IsImportant}", id, item.IsImportant);
            return item;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling important for item ID: {Id} in list ID: {ListId}", id, listId);
            throw;
        }
    }

    /// <summary>
    /// Bulk update display order. Body is array of item IDs in desired order.
    /// </summary>
    [HttpPut("order")]
    public async Task<IActionResult> UpdateOrder(int listId, [FromBody] int[] orderedIds)
    {
        if (orderedIds == null || orderedIds.Length == 0)
            return BadRequest("No item ids provided");

        var items = await _context.ShoppingItems
            .Where(i => i.ShoppingListId == listId && orderedIds.Contains(i.Id))
            .ToListAsync();
        var indexById = orderedIds.Select((id, idx) => (id, idx)).ToDictionary(x => x.id, x => x.idx);
        foreach (var item in items)
        {
            item.DisplayOrder = indexById.TryGetValue(item.Id, out var idx) ? idx : item.DisplayOrder;
        }
        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Clear all bought items from a list
    /// </summary>
    [HttpDelete("bought")]
    public async Task<IActionResult> ClearBought(int listId)
    {
        try
        {
            var boughtItems = await _context.ShoppingItems
                .Where(i => i.ShoppingListId == listId && i.IsBought)
                .ToListAsync();
            
            _context.ShoppingItems.RemoveRange(boughtItems);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Cleared {Count} bought items from list ID: {ListId}", boughtItems.Count, listId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing bought items from list ID: {ListId}", listId);
            throw;
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int listId, int id)
    {
        try
        {
            var item = await _context.ShoppingItems
                .FirstOrDefaultAsync(i => i.Id == id && i.ShoppingListId == listId);
            if (item == null) return NotFound();

            _context.ShoppingItems.Remove(item);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Deleted item ID: {Id} from list ID: {ListId}", id, listId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting item ID: {Id} from list ID: {ListId}", id, listId);
            throw;
        }
    }
}
