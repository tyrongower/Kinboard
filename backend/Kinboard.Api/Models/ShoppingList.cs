namespace Kinboard.Api.Models;

public class ShoppingList
{
    public int Id { get; set; }
    
    // Display name for the list
    public string Name { get; set; } = string.Empty;
    
    // Hex color like #RRGGBB used for UI accents
    public string ColorHex { get; set; } = "#3B82F6";
    
    // Optional URL to an avatar image (served as static file)
    public string? AvatarUrl { get; set; }
    
    // Display order for kiosk and admin lists (lower first)
    public int DisplayOrder { get; set; } = 0;
    
    // Navigation collection for shopping items
    public ICollection<ShoppingItem> Items { get; set; } = new List<ShoppingItem>();
}
