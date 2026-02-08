using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kinboard.Api.Data;
using Kinboard.Api.Models;
using Kinboard.Api.Dtos;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace Kinboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Require authentication (admin + kiosk)
public class JobsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<JobsController> _logger;

    public JobsController(AppDbContext context, ILogger<JobsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<JobDto>>> GetJobs([FromQuery] string? date = null)
    {
        try
        {
            _logger.LogDebug("Fetching jobs for date: {Date}", date ?? "all");
            var isKiosk = User.IsInRole("kiosk");

            if (string.IsNullOrEmpty(date))
            {
                var all = await _context.Jobs
                    .Include(c => c.Assignments)
                        .ThenInclude(a => a.User)
                    .ToListAsync();
                _logger.LogInformation("Retrieved {Count} total jobs", all.Count);
                return Ok(all.Select(c => MapToDto(c, null, null, null, isKiosk)));
            }

            // Parse date in YYYY-MM-DD format without timezone conversion
            if (!DateTime.TryParseExact(date, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var targetDate))
            {
                _logger.LogWarning("Invalid date format provided: {Date}. Expected YYYY-MM-DD format.", date);
                return BadRequest("Invalid date format. Expected YYYY-MM-DD format.");
            }

            var targetDateOnly = targetDate.Date;

            // Recurring jobs evaluated in-memory
            var allChores = await _context.Jobs
                .Include(c => c.Assignments)
                    .ThenInclude(a => a.User)
                .ToListAsync();

            var result = allChores.Where(c =>
                RecurrenceEvaluator.OccursOn(c, targetDateOnly) ||
                (!c.UseSharedRecurrence && c.Assignments.Any(a => RecurrenceEvaluator.AssignmentOccursOn(a, targetDateOnly)))
            ).ToList();

            // Load completions for this date (including assignment-specific completions)
            var choreIds = result.Select(c => c.Id).ToList();
            var completions = await _context.JobCompletions
                .Where(cc => choreIds.Contains(cc.JobId) && cc.OccurrenceDate.Date == targetDateOnly)
                .ToListAsync();

            // Separate legacy completions (no assignment) from assignment-specific completions
            var legacyCompletionMap = completions
                .Where(cc => cc.JobAssignmentId == null)
                .ToDictionary(cc => cc.JobId, cc => cc);
            var assignmentCompletions = completions
                .Where(cc => cc.JobAssignmentId != null)
                .ToList();

            _logger.LogInformation("Retrieved {Count} jobs for date {Date}", result.Count, targetDateOnly);
            return Ok(result.Select(c => MapToDto(c, targetDateOnly, legacyCompletionMap.GetValueOrDefault(c.Id), assignmentCompletions.Where(ac => ac.JobId == c.Id).ToList(), isKiosk)));
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error fetching jobs for date: {Date}", date);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error fetching jobs for date: {Date}", date);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<JobDto>> GetJob(int id, [FromQuery] string? date = null)
    {
        try
        {
            _logger.LogDebug("Fetching job ID: {Id}", id);
            var chore = await _context.Jobs
                .Include(c => c.Assignments)
                    .ThenInclude(a => a.User)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (chore == null)
            {
                _logger.LogWarning("Job ID {Id} not found", id);
                return NotFound(new { message = "Job not found" });
            }

            JobCompletion? completion = null;
            List<JobCompletion>? assignmentCompletions = null;
            DateTime? occurrenceDate = null;

            if (!string.IsNullOrEmpty(date) && DateTime.TryParseExact(date, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var parsedDate))
            {
                occurrenceDate = parsedDate.Date;
                var completions = await _context.JobCompletions
                    .Where(cc => cc.JobId == id && cc.OccurrenceDate.Date == occurrenceDate.Value)
                    .ToListAsync();

                completion = completions.FirstOrDefault(cc => cc.JobAssignmentId == null);
                assignmentCompletions = completions.Where(cc => cc.JobAssignmentId != null).ToList();
            }

            var isKiosk = User.IsInRole("kiosk");
            return MapToDto(chore, occurrenceDate, completion, assignmentCompletions, isKiosk);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error fetching job ID: {Id}", id);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error fetching job ID: {Id}", id);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "admin")] // Admin only
    public async Task<ActionResult<JobDto>> CreateJob(JobDto dto)
    {
        try
        {
            _logger.LogInformation("Creating job: {Title}", dto.Title);
            var entity = await MapFromDtoAsync(dto);
            _context.Jobs.Add(entity);
            await _context.SaveChangesAsync();

            // reload with assignments for DTO
            await _context.Entry(entity).Collection(c => c.Assignments).LoadAsync();
            var outDto = MapToDto(entity, null, null, null, false);
            _logger.LogInformation("Job created successfully with ID: {Id}", entity.Id);
            return CreatedAtAction(nameof(GetJob), new { id = entity.Id }, outDto);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error creating job: {Title}", dto.Title);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating job: {Title}", dto.Title);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")] // Admin only
    public async Task<IActionResult> UpdateJob(int id, JobDto dto)
    {
        try
        {
            if (id != dto.Id)
            {
                return BadRequest();
            }

            _logger.LogInformation("Updating job ID: {Id}", id);
            var existing = await _context.Jobs.FirstOrDefaultAsync(c => c.Id == id);
            if (existing == null)
            {
                _logger.LogWarning("Job ID {Id} not found for update", id);
                return NotFound();
            }

            // Update the entity
            await UpdateEntityFromDtoAsync(existing, dto);

            await _context.SaveChangesAsync();
            _logger.LogInformation("Job ID {Id} updated successfully", id);
            return NoContent();
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogError(ex, "Concurrency error updating job ID: {Id}", id);
            if (!JobExists(id))
            {
                return NotFound(new { message = "Job not found" });
            }
            else
            {
                return StatusCode(500, new { message = "Concurrency error occurred" });
            }
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error updating job ID: {Id}", id);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating job ID: {Id}", id);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")] // Admin only
    public async Task<IActionResult> DeleteJob(int id)
    {
        try
        {
            _logger.LogInformation("Deleting job ID: {Id}", id);
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
            {
                _logger.LogWarning("Job ID {Id} not found for deletion", id);
                return NotFound();
            }

            _context.Jobs.Remove(job);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Job ID {Id} deleted successfully", id);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error deleting job ID: {Id}", id);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting job ID: {Id}", id);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    private bool JobExists(int id)
    {
        return _context.Jobs.Any(e => e.Id == id);
    }

    private static JobDto MapToDto(Job c, DateTime? occurrenceDate, JobCompletion? completion = null, List<JobCompletion>? assignmentCompletions = null, bool filterHiddenUsers = false)
    {
        // Filter assignments based on recurrence when querying by date
        var assignmentsToMap = c.Assignments ?? new List<JobAssignment>();

        // When UseSharedRecurrence is false and we have a target date, filter assignments by their individual recurrence
        if (!c.UseSharedRecurrence && occurrenceDate.HasValue)
        {
            assignmentsToMap = assignmentsToMap.Where(a => RecurrenceEvaluator.AssignmentOccursOn(a, occurrenceDate.Value)).ToList();
        }

        // Filter out assignments for users hidden from kiosk
        if (filterHiddenUsers)
        {
            assignmentsToMap = assignmentsToMap.Where(a => a.User == null || !a.User.HideFromKiosk).ToList();
        }

        // Map assignments with their completion status
        var assignments = assignmentsToMap.Select(a => {
            var assignmentCompletion = assignmentCompletions?.FirstOrDefault(ac => ac.JobAssignmentId == a.Id);
            return new JobAssignmentDto
            {
                Id = a.Id,
                JobId = a.JobId,
                UserId = a.UserId,
                User = a.User == null ? null : new UserDto
                {
                    Id = a.User.Id,
                    DisplayName = a.User.DisplayName,
                    ColorHex = a.User.ColorHex,
                    AvatarUrl = a.User.AvatarUrl,
                    DisplayOrder = a.User.DisplayOrder
                },
                Recurrence = a.Recurrence,
                RecurrenceStartDate = a.RecurrenceStartDate,
                RecurrenceEndDate = a.RecurrenceEndDate,
                RecurrenceIndefinite = a.RecurrenceIndefinite,
                DisplayOrder = a.DisplayOrder,
                IsCompleted = assignmentCompletion != null,
                CompletedAt = assignmentCompletion?.CompletedAt
            };
        }).OrderBy(a => a.DisplayOrder).ToList();

        return new JobDto
        {
            Id = c.Id,
            Title = c.Title,
            Description = c.Description,
            ImageUrl = c.ImageUrl,
            CreatedAt = c.CreatedAt,
            Recurrence = c.Recurrence,
            RecurrenceStartDate = c.RecurrenceStartDate,
            RecurrenceEndDate = c.RecurrenceEndDate,
            RecurrenceIndefinite = c.RecurrenceIndefinite,
            UseSharedRecurrence = c.UseSharedRecurrence,
            Assignments = assignments,
            OccurrenceDate = occurrenceDate
        };
    }

    private async Task<Job> MapFromDtoAsync(JobDto dto)
    {
        var entity = new Job();
        await UpdateEntityFromDtoAsync(entity, dto);
        return entity;
    }

    private Task UpdateEntityFromDtoAsync(Job entity, JobDto dto)
    {
        entity.Title = dto.Title;
        entity.Description = dto.Description;
        entity.CreatedAt = dto.CreatedAt == default ? entity.CreatedAt : dto.CreatedAt;
        entity.Recurrence = dto.Recurrence;
        entity.RecurrenceStartDate = dto.RecurrenceStartDate;
        entity.RecurrenceEndDate = dto.RecurrenceIndefinite ? null : dto.RecurrenceEndDate;
        entity.RecurrenceIndefinite = dto.RecurrenceIndefinite;
        entity.UseSharedRecurrence = dto.UseSharedRecurrence;

        return Task.CompletedTask;
    }

    // Image upload constants (same as user avatars)
    private const int MaxImageBytes = 5_000_000; // 5 MB
    private const int MinDimension = 64;
    private const int MaxDimension = 5000;
    private const int OutputSize = 256;
    private static readonly WebpEncoder WebpEncoder = new WebpEncoder { Quality = 80 };

    /// <summary>
    /// Upload an image for a job (multipart form-data with "file" field).
    /// </summary>
    [HttpPost("{id}/image")]
    public async Task<IActionResult> UploadImage(int id, IFormFile file)
    {
        try
        {
            _logger.LogDebug("Uploading image for job ID: {Id}", id);
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
            {
                _logger.LogWarning("Job ID {Id} not found for image upload", id);
                return NotFound(new { message = "Job not found" });
            }

            if (file == null || file.Length == 0)
            {
                _logger.LogWarning("No file provided for job ID: {Id}", id);
                return BadRequest(new { message = "No file provided" });
            }
            if (file.Length > MaxImageBytes)
            {
                _logger.LogWarning("File too large for job ID: {Id}, size: {Size} bytes", id, file.Length);
                return BadRequest(new { message = "File too large (max 5MB)" });
            }

            Image image;
            try
            {
                await using var inStream = file.OpenReadStream();
                image = await Image.LoadAsync(inStream);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Invalid image file for job ID: {Id}", id);
                return BadRequest(new { message = "Invalid image file" });
            }

            if (image.Width < MinDimension || image.Height < MinDimension || image.Width > MaxDimension || image.Height > MaxDimension)
            {
                image.Dispose();
                _logger.LogWarning("Image dimensions out of range for job ID: {Id}, dimensions: {Width}x{Height}", id, image.Width, image.Height);
                return BadRequest(new { message = $"Image dimensions out of range ({MinDimension}-{MaxDimension}px)" });
            }

            // Center-crop to square then resize
            int side = Math.Min(image.Width, image.Height);
            var rect = new Rectangle((image.Width - side) / 2, (image.Height - side) / 2, side, side);
            image.Mutate(x => x.Crop(rect).Resize(OutputSize, OutputSize));

            var imagesRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "job-images");
            Directory.CreateDirectory(imagesRoot);
            var fileName = $"job_{id}.webp";
            var fullPath = Path.Combine(imagesRoot, fileName);
            await using (var outStream = System.IO.File.Create(fullPath))
            {
                await image.SaveAsWebpAsync(outStream, WebpEncoder);
            }
            image.Dispose();

            job.ImageUrl = $"/job-images/{fileName}";
            await _context.SaveChangesAsync();
            var cacheBusted = job.ImageUrl + $"?v={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
            _logger.LogInformation("Image uploaded successfully for job ID: {Id}", id);
            return Ok(new { imageUrl = cacheBusted });
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error uploading image for job ID: {Id}", id);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error uploading image for job ID: {Id}", id);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Delete the image for a job.
    /// </summary>
    [HttpDelete("{id}/image")]
    public async Task<IActionResult> DeleteImage(int id)
    {
        try
        {
            _logger.LogDebug("Deleting image for job ID: {Id}", id);
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
            {
                _logger.LogWarning("Job ID {Id} not found for image deletion", id);
                return NotFound(new { message = "Job not found" });
            }

            if (!string.IsNullOrWhiteSpace(job.ImageUrl))
            {
                var path = job.ImageUrl.Split('?')[0].Replace('/', Path.DirectorySeparatorChar);
                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", path.TrimStart(Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                }
                job.ImageUrl = null;
                await _context.SaveChangesAsync();
            }

            _logger.LogInformation("Image deleted for job ID: {Id}", id);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error deleting image for job ID: {Id}", id);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting image for job ID: {Id}", id);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    private static class RecurrenceEvaluator
    {
        private static readonly Dictionary<string, DayOfWeek> ByDayMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["MO"] = DayOfWeek.Monday,
            ["TU"] = DayOfWeek.Tuesday,
            ["WE"] = DayOfWeek.Wednesday,
            ["TH"] = DayOfWeek.Thursday,
            ["FR"] = DayOfWeek.Friday,
            ["SA"] = DayOfWeek.Saturday,
            ["SU"] = DayOfWeek.Sunday,
        };

        public static bool OccursOn(Job chore, DateTime date)
        {
            if (string.IsNullOrWhiteSpace(chore.Recurrence)) return false;
            if (!chore.RecurrenceStartDate.HasValue) return false;

            var start = chore.RecurrenceStartDate.Value.Date;
            var target = date.Date;
            if (target < start) return false;
            if (!chore.RecurrenceIndefinite && chore.RecurrenceEndDate.HasValue && target > chore.RecurrenceEndDate.Value.Date)
            {
                return false;
            }

            var rule = ParseRule(chore.Recurrence);
            var freq = rule.TryGetValue("FREQ", out var f) ? f.ToUpperInvariant() : "";
            var interval = 1;
            if (rule.TryGetValue("INTERVAL", out var intervalStr) && int.TryParse(intervalStr, out var iv) && iv > 0)
            {
                interval = iv;
            }

            switch (freq)
            {
                case "DAILY":
                    return OccursDaily(start, target, interval);
                case "WEEKLY":
                    {
                        var byDays = ParseByDays(rule);
                        return OccursWeekly(start, target, interval, byDays);
                    }
                default:
                    return false;
            }
        }

        public static bool AssignmentOccursOn(JobAssignment assignment, DateTime date)
        {
            if (string.IsNullOrWhiteSpace(assignment.Recurrence)) return false;
            if (!assignment.RecurrenceStartDate.HasValue) return false;

            var start = assignment.RecurrenceStartDate.Value.Date;
            var target = date.Date;
            if (target < start) return false;
            if (!assignment.RecurrenceIndefinite && assignment.RecurrenceEndDate.HasValue && target > assignment.RecurrenceEndDate.Value.Date)
            {
                return false;
            }

            var rule = ParseRule(assignment.Recurrence);
            var freq = rule.TryGetValue("FREQ", out var f) ? f.ToUpperInvariant() : "";
            var interval = 1;
            if (rule.TryGetValue("INTERVAL", out var intervalStr) && int.TryParse(intervalStr, out var iv) && iv > 0)
            {
                interval = iv;
            }

            switch (freq)
            {
                case "DAILY":
                    return OccursDaily(start, target, interval);
                case "WEEKLY":
                    {
                        var byDays = ParseByDays(rule);
                        return OccursWeekly(start, target, interval, byDays);
                    }
                default:
                    return false;
            }
        }

        private static bool OccursDaily(DateTime start, DateTime target, int interval)
        {
            var delta = (target - start).Days;
            return delta >= 0 && (delta % interval) == 0;
        }

        private static bool OccursWeekly(DateTime start, DateTime target, int interval, HashSet<DayOfWeek>? byDays)
        {
            // Anchor weeks by Monday
            var startWeek = StartOfWeekMonday(start);
            var targetWeek = StartOfWeekMonday(target);
            var weeks = (int)((targetWeek - startWeek).TotalDays / 7);
            if (weeks < 0) return false;
            if ((weeks % interval) != 0) return false;

            if (byDays == null || byDays.Count == 0)
            {
                // Default to the same weekday as the start date
                return target.DayOfWeek == start.DayOfWeek;
            }
            return byDays.Contains(target.DayOfWeek);
        }

        private static DateTime StartOfWeekMonday(DateTime d)
        {
            var diff = ((int)d.DayOfWeek + 6) % 7; // Monday=0 ... Sunday=6
            return d.Date.AddDays(-diff);
        }

        private static Dictionary<string, string> ParseRule(string rrule)
        {
            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            var parts = rrule.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var part in parts)
            {
                var kv = part.Split('=', 2, StringSplitOptions.TrimEntries);
                if (kv.Length == 2)
                {
                    dict[kv[0]] = kv[1];
                }
            }
            return dict;
        }

        private static HashSet<DayOfWeek>? ParseByDays(Dictionary<string, string> rule)
        {
            if (!rule.TryGetValue("BYDAY", out var val) || string.IsNullOrWhiteSpace(val)) return null;
            var set = new HashSet<DayOfWeek>();
            var tokens = val.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var t in tokens)
            {
                if (ByDayMap.TryGetValue(t.ToUpperInvariant(), out var dow))
                {
                    set.Add(dow);
                }
            }
            return set;
        }
    }
}
