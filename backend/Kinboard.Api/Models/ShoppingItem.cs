using System.Text.Json.Serialization;

namespace Kinboard.Api.Models;

public class ShoppingItem
{
    public int Id { get; set; }
    
    // Foreign key to the shopping list
    public int ShoppingListId { get; set; }
    
    // Item name/description
    public string Name { get; set; } = string.Empty;
    
    // Whether the item has been bought/checked off
    public bool IsBought { get; set; } = false;
    
    // Whether the item is flagged as important
    public bool IsImportant { get; set; } = false;
    
    // Display order within the list (lower first)
    public int DisplayOrder { get; set; } = 0;
    
    // When the item was created
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation property to parent list (ignored in JSON to prevent circular reference)
    [JsonIgnore]
    public ShoppingList? ShoppingList { get; set; }
}
