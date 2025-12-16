using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kinboard.Api.Data;
using Kinboard.Api.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using System.Net;
using System.Net.Sockets;

namespace Kinboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<UsersController> _logger;

    public UsersController(AppDbContext context, ILogger<UsersController> logger)
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
    public async Task<ActionResult<IEnumerable<User>>> GetUsers()
    {
        try
        {
            _logger.LogDebug("Fetching all users");
            var users = await _context.Users
                .AsNoTracking()
                .OrderBy(u => u.DisplayOrder)
                .ThenBy(u => u.DisplayName)
                .ToListAsync();
            _logger.LogInformation("Retrieved {Count} users", users.Count);
            return users;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving users");
            throw;
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<User>> GetUser(int id)
    {
        try
        {
            _logger.LogDebug("Fetching user ID: {Id}", id);
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                _logger.LogWarning("User ID {Id} not found", id);
                return NotFound();
            }
            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user ID: {Id}", id);
            throw;
        }
    }

    [HttpPost]
    public async Task<ActionResult<User>> CreateUser(User user)
    {
        try
        {
            _logger.LogInformation("Creating user: {Username}", user.Username);
            // Basic normalization: ensure color starts with '#'
            if (!string.IsNullOrWhiteSpace(user.ColorHex) && !user.ColorHex.StartsWith('#'))
            {
                user.ColorHex = "#" + user.ColorHex.Trim();
            }

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            _logger.LogInformation("User created successfully with ID: {Id}", user.Id);
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user: {Username}", user.Username);
            throw;
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, User user)
    {
        if (id != user.Id) return BadRequest();

        try
        {
            _logger.LogInformation("Updating user ID: {Id}", id);
            if (!string.IsNullOrWhiteSpace(user.ColorHex) && !user.ColorHex.StartsWith('#'))
            {
                user.ColorHex = "#" + user.ColorHex.Trim();
            }

            _context.Entry(user).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            _logger.LogInformation("User ID {Id} updated successfully", id);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error updating user ID: {Id}", id);
            // Likely uniqueness violation on Username
            return Problem(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user ID: {Id}", id);
            throw;
        }
    }

    /// <summary>
    /// Bulk update display order. Body is array of user IDs in desired order.
    /// </summary>
    [HttpPut("order")]
    public async Task<IActionResult> UpdateOrder([FromBody] int[] orderedIds)
    {
        if (orderedIds == null || orderedIds.Length == 0)
            return BadRequest("No user ids provided");

        var users = await _context.Users.Where(u => orderedIds.Contains(u.Id)).ToListAsync();
        var indexById = orderedIds.Select((id, idx) => (id, idx)).ToDictionary(x => x.id, x => x.idx);
        foreach (var u in users)
        {
            u.DisplayOrder = indexById.TryGetValue(u.Id, out var idx) ? idx : u.DisplayOrder;
        }
        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Upload avatar image for a user. Validates and processes to a 256x256 WebP at a stable path.
    /// </summary>
    [HttpPost("{id}/avatar")]
    [RequestSizeLimit(MaxAvatarBytes)]
    public async Task<IActionResult> UploadAvatar(int id, IFormFile file)
    {
        try
        {
            _logger.LogInformation("Uploading avatar for user ID: {Id}", id);
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
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
        var fileName = $"user_{id}.webp";
        var fullPath = Path.Combine(avatarsRoot, fileName);
        await using (var outStream = System.IO.File.Create(fullPath))
        {
            await image.SaveAsWebpAsync(outStream, WebpEncoder);
        }
        image.Dispose();

        user.AvatarUrl = $"/avatars/{fileName}";
        await _context.SaveChangesAsync();
        var cacheBusted = user.AvatarUrl + $"?v={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
        _logger.LogInformation("Avatar uploaded successfully for user ID: {Id}", id);
        return Ok(new { avatarUrl = cacheBusted });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading avatar for user ID: {Id}", id);
            throw;
        }
    }

    public class FetchAvatarRequest { public string Url { get; set; } = string.Empty; }

    /// <summary>
    /// Fetch avatar from a remote URL, validate/process identically to upload, and store locally.
    /// </summary>
    [HttpPost("{id}/avatar/fetch")]
    public async Task<IActionResult> FetchAvatar(int id, [FromBody] FetchAvatarRequest body, [FromServices] IHttpClientFactory httpFactory)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();
        if (string.IsNullOrWhiteSpace(body?.Url)) return BadRequest("Missing url");

        if (!Uri.TryCreate(body.Url, UriKind.Absolute, out var uri)) return BadRequest("Invalid url");
        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) return BadRequest("Only http/https URLs are allowed");

        // Basic SSRF protections: block private/reserved IPs
        try
        {
            var host = uri.DnsSafeHost;
            var addresses = await Dns.GetHostAddressesAsync(host);
            foreach (var addr in addresses)
            {
                if (addr.AddressFamily == AddressFamily.InterNetwork || addr.AddressFamily == AddressFamily.InterNetworkV6)
                {
                    if (IsPrivateIp(addr)) return BadRequest("Target not allowed");
                }
            }
        }
        catch { return BadRequest("Could not resolve host"); }

        var client = httpFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);
        using var req = new HttpRequestMessage(HttpMethod.Get, uri);
        using var resp = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead);
        if (!resp.IsSuccessStatusCode) return BadRequest("Failed to download image");
        if (resp.Content.Headers.ContentLength is long len && len > MaxAvatarBytes)
            return BadRequest("File too large");
        var contentType = resp.Content.Headers.ContentType?.MediaType ?? "";
        if (!contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest("URL is not an image");

        await using var networkStream = await resp.Content.ReadAsStreamAsync();
        using var limited = new LimitedReadStream(networkStream, MaxAvatarBytes + 1);

        Image image;
        try { image = await Image.LoadAsync(limited); }
        catch { return BadRequest("Invalid image data"); }

        if (image.Width < MinDimension || image.Height < MinDimension || image.Width > MaxDimension || image.Height > MaxDimension)
        {
            image.Dispose();
            return BadRequest($"Image dimensions out of range ({MinDimension}-{MaxDimension}px)");
        }

        int side = Math.Min(image.Width, image.Height);
        var rect = new Rectangle((image.Width - side) / 2, (image.Height - side) / 2, side, side);
        image.Mutate(x => x.Crop(rect).Resize(OutputSize, OutputSize));

        var avatarsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");
        Directory.CreateDirectory(avatarsRoot);
        var fileName = $"user_{id}.webp";
        var fullPath = Path.Combine(avatarsRoot, fileName);
        await using (var outStream = System.IO.File.Create(fullPath))
        {
            await image.SaveAsWebpAsync(outStream, WebpEncoder);
        }
        image.Dispose();

        user.AvatarUrl = $"/avatars/{fileName}";
        await _context.SaveChangesAsync();
        var cacheBusted = user.AvatarUrl + $"?v={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
        return Ok(new { avatarUrl = cacheBusted });
    }

    private static bool IsPrivateIp(IPAddress ip)
    {
        if (ip.AddressFamily == AddressFamily.InterNetwork)
        {
            byte[] bytes = ip.GetAddressBytes();
            // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8
            if (bytes[0] == 10) return true;
            if (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) return true;
            if (bytes[0] == 192 && bytes[1] == 168) return true;
            if (bytes[0] == 127) return true;
        }
        if (ip.IsIPv6LinkLocal || ip.IsIPv6Multicast || ip.IsIPv6SiteLocal || IPAddress.IsLoopback(ip)) return true;
        return false;
    }

    private sealed class LimitedReadStream : Stream
    {
        private readonly Stream _inner;
        private readonly long _max;
        private long _read;
        public LimitedReadStream(Stream inner, long max) { _inner = inner; _max = max; }
        public override bool CanRead => _inner.CanRead;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => _inner.Length;
        public override long Position { get => _inner.Position; set => throw new NotSupportedException(); }
        public override void Flush() => _inner.Flush();
        public override int Read(byte[] buffer, int offset, int count)
        {
            int toRead = (int)Math.Min(count, _max - _read);
            int n = _inner.Read(buffer, offset, toRead);
            _read += n;
            if (_read > _max) throw new IOException("Stream too large");
            return n;
        }
        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
        public override async ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
        {
            int toRead = (int)Math.Min(buffer.Length, _max - _read);
            int n = await _inner.ReadAsync(buffer.Slice(0, toRead), cancellationToken);
            _read += n;
            if (_read > _max) throw new IOException("Stream too large");
            return n;
        }
    }

    /// <summary>
    /// Delete avatar for a user
    /// </summary>
    [HttpDelete("{id}/avatar")]
    public async Task<IActionResult> DeleteAvatar(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();
        
        // Delete avatar file
        try
        {
            if (!string.IsNullOrWhiteSpace(user.AvatarUrl))
            {
                var path = user.AvatarUrl.Split('?')[0].Replace('/', Path.DirectorySeparatorChar);
                var full = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", path.TrimStart(Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(full)) System.IO.File.Delete(full);
            }
        }
        catch { /* ignore file delete errors */ }
        
        user.AvatarUrl = null;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();
        // Try delete avatar file
        try
        {
            if (!string.IsNullOrWhiteSpace(user.AvatarUrl))
            {
                var path = user.AvatarUrl.Split('?')[0].Replace('/', Path.DirectorySeparatorChar);
                var full = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", path.TrimStart(Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(full)) System.IO.File.Delete(full);
            }
        }
        catch { /* ignore file delete errors */ }
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private bool UserExists(int id) => _context.Users.Any(u => u.Id == id);
}
