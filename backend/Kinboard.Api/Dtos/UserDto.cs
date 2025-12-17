namespace Kinboard.Api.Dtos;

public class UserDto
{
    public int Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string ColorHex { get; set; } = "#777777";
    public string? AvatarUrl { get; set; }
    public int DisplayOrder { get; set; }
}
