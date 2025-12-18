using Kinboard.Api.Data;
using Kinboard.Api.Dtos;
using Kinboard.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kinboard.Api.Controllers;

[ApiController]
[Route("api/jobs/{jobId}/assignments")]
[Authorize] // Require authentication (admin + kiosk)
public class JobAssignmentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<JobAssignmentsController> _logger;

    public JobAssignmentsController(AppDbContext context, ILogger<JobAssignmentsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/jobs/{jobId}/assignments
    [HttpGet]
    public async Task<ActionResult<IEnumerable<JobAssignmentDto>>> GetAssignments(int jobId, [FromQuery] string? date = null)
    {
        try
        {
            _logger.LogDebug("Fetching assignments for job ID: {JobId}", jobId);
            var job = await _context.Jobs.FindAsync(jobId);
            if (job == null)
            {
                _logger.LogWarning("Job ID {JobId} not found", jobId);
                return NotFound(new { message = "Job not found" });
            }

            var assignments = await _context.JobAssignments
                .Include(a => a.User)
                .Where(a => a.JobId == jobId)
                .OrderBy(a => a.DisplayOrder)
                .ToListAsync();

            DateTime? occurrenceDate = null;
            List<JobCompletion>? completions = null;

            if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var parsedDate))
            {
                occurrenceDate = parsedDate.Date;
                completions = await _context.JobCompletions
                    .Where(cc => cc.JobId == jobId && cc.OccurrenceDate.Date == occurrenceDate.Value && cc.JobAssignmentId != null)
                    .ToListAsync();
            }

            _logger.LogInformation("Retrieved {Count} assignments for job ID: {JobId}", assignments.Count, jobId);
            return Ok(assignments.Select(a => MapToDto(a, occurrenceDate, completions?.FirstOrDefault(c => c.JobAssignmentId == a.Id))));
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error fetching assignments for job ID: {JobId}", jobId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error fetching assignments for job ID: {JobId}", jobId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    // GET: api/jobs/{jobId}/assignments/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<JobAssignmentDto>> GetAssignment(int jobId, int id, [FromQuery] string? date = null)
    {
        try
        {
            _logger.LogDebug("Fetching assignment ID: {Id} for job ID: {JobId}", id, jobId);
            var assignment = await _context.JobAssignments
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.Id == id && a.JobId == jobId);

            if (assignment == null)
            {
                _logger.LogWarning("Assignment ID {Id} not found for job ID: {JobId}", id, jobId);
                return NotFound(new { message = "Assignment not found" });
            }

            JobCompletion? completion = null;
            DateTime? occurrenceDate = null;

            if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var parsedDate))
            {
                occurrenceDate = parsedDate.Date;
                completion = await _context.JobCompletions
                    .FirstOrDefaultAsync(cc => cc.JobAssignmentId == id && cc.OccurrenceDate.Date == occurrenceDate.Value);
            }

            return MapToDto(assignment, occurrenceDate, completion);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error fetching assignment ID: {Id} for job ID: {JobId}", id, jobId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error fetching assignment ID: {Id} for job ID: {JobId}", id, jobId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    // POST: api/jobs/{jobId}/assignments
    [HttpPost]
    public async Task<ActionResult<JobAssignmentDto>> CreateAssignment(int jobId, JobAssignmentDto dto)
    {
        try
        {
            _logger.LogDebug("Creating assignment for job ID: {JobId}, user ID: {UserId}", jobId, dto.UserId);
            var job = await _context.Jobs.FindAsync(jobId);
            if (job == null)
            {
                _logger.LogWarning("Job ID {JobId} not found for assignment creation", jobId);
                return NotFound(new { message = "Job not found" });
            }

            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
            {
                _logger.LogWarning("User ID {UserId} not found for assignment creation", dto.UserId);
                return BadRequest(new { message = "User not found" });
            }

            // Check if assignment already exists for this user
            var existingAssignment = await _context.JobAssignments
                .FirstOrDefaultAsync(a => a.JobId == jobId && a.UserId == dto.UserId);
            if (existingAssignment != null)
            {
                _logger.LogWarning("User ID {UserId} already assigned to job ID {JobId}", dto.UserId, jobId);
                return BadRequest(new { message = "User is already assigned to this job" });
            }

            // Get max display order
            var maxOrder = await _context.JobAssignments
                .Where(a => a.JobId == jobId)
                .MaxAsync(a => (int?)a.DisplayOrder) ?? -1;

            var entity = new JobAssignment
            {
                JobId = jobId,
                UserId = dto.UserId,
                Recurrence = dto.Recurrence,
                RecurrenceStartDate = dto.RecurrenceStartDate,
                RecurrenceEndDate = dto.RecurrenceIndefinite ? null : dto.RecurrenceEndDate,
                RecurrenceIndefinite = dto.RecurrenceIndefinite,
                DisplayOrder = maxOrder + 1
            };

            _context.JobAssignments.Add(entity);
            await _context.SaveChangesAsync();

            // Reload with user
            await _context.Entry(entity).Reference(a => a.User).LoadAsync();

            _logger.LogInformation("Created assignment {Id} for job {JobId} and user {UserId}", entity.Id, jobId, dto.UserId);
            return CreatedAtAction(nameof(GetAssignment), new { jobId, id = entity.Id }, MapToDto(entity, null, null));
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error creating assignment for job ID: {JobId}", jobId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating assignment for job ID: {JobId}", jobId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    // PUT: api/jobs/{jobId}/assignments/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAssignment(int jobId, int id, JobAssignmentDto dto)
    {
        try
        {
            if (id != dto.Id)
            {
                _logger.LogWarning("Assignment ID mismatch: URL ID {UrlId} vs Body ID {BodyId}", id, dto.Id);
                return BadRequest(new { message = "ID mismatch" });
            }

            _logger.LogDebug("Updating assignment ID: {Id} for job ID: {JobId}", id, jobId);
            var assignment = await _context.JobAssignments
                .FirstOrDefaultAsync(a => a.Id == id && a.JobId == jobId);

            if (assignment == null)
            {
                _logger.LogWarning("Assignment ID {Id} not found for job ID: {JobId}", id, jobId);
                return NotFound(new { message = "Assignment not found" });
            }

            // If changing user, check for duplicate
            if (assignment.UserId != dto.UserId)
            {
                var existingAssignment = await _context.JobAssignments
                    .FirstOrDefaultAsync(a => a.JobId == jobId && a.UserId == dto.UserId && a.Id != id);
                if (existingAssignment != null)
                {
                    _logger.LogWarning("User ID {UserId} already assigned to job ID {JobId}", dto.UserId, jobId);
                    return BadRequest(new { message = "User is already assigned to this job" });
                }

                var user = await _context.Users.FindAsync(dto.UserId);
                if (user == null)
                {
                    _logger.LogWarning("User ID {UserId} not found for assignment update", dto.UserId);
                    return BadRequest(new { message = "User not found" });
                }
                assignment.UserId = dto.UserId;
            }

            assignment.Recurrence = dto.Recurrence;
            assignment.RecurrenceStartDate = dto.RecurrenceStartDate;
            assignment.RecurrenceEndDate = dto.RecurrenceIndefinite ? null : dto.RecurrenceEndDate;
            assignment.RecurrenceIndefinite = dto.RecurrenceIndefinite;
            assignment.DisplayOrder = dto.DisplayOrder;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated assignment {Id} for job {JobId}", id, jobId);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error updating assignment ID: {Id} for job ID: {JobId}", id, jobId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating assignment ID: {Id} for job ID: {JobId}", id, jobId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    // DELETE: api/jobs/{jobId}/assignments/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAssignment(int jobId, int id)
    {
        try
        {
            _logger.LogDebug("Deleting assignment ID: {Id} for job ID: {JobId}", id, jobId);
            var assignment = await _context.JobAssignments
                .FirstOrDefaultAsync(a => a.Id == id && a.JobId == jobId);

            if (assignment == null)
            {
                _logger.LogWarning("Assignment ID {Id} not found for job ID: {JobId}", id, jobId);
                return NotFound(new { message = "Assignment not found" });
            }

            _context.JobAssignments.Remove(assignment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted assignment {Id} for job {JobId}", id, jobId);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error deleting assignment ID: {Id} for job ID: {JobId}", id, jobId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting assignment ID: {Id} for job ID: {JobId}", id, jobId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    // PUT: api/jobs/{jobId}/assignments/order
    [HttpPut("order")]
    public async Task<IActionResult> UpdateOrder(int jobId, [FromBody] int[] assignmentIds)
    {
        try
        {
            _logger.LogDebug("Updating assignment order for job ID: {JobId}", jobId);
            var assignments = await _context.JobAssignments
                .Where(a => a.JobId == jobId)
                .ToListAsync();

            for (int i = 0; i < assignmentIds.Length; i++)
            {
                var assignment = assignments.FirstOrDefault(a => a.Id == assignmentIds[i]);
                if (assignment != null)
                {
                    assignment.DisplayOrder = i;
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated assignment order for job {JobId}", jobId);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error updating assignment order for job ID: {JobId}", jobId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating assignment order for job ID: {JobId}", jobId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    // POST: api/jobs/{jobId}/assignments/{id}/complete
    [HttpPost("{id}/complete")]
    public async Task<IActionResult> CompleteAssignment(int jobId, int id, [FromQuery] string date)
    {
        try
        {
            _logger.LogDebug("Completing assignment ID: {Id} for job ID: {JobId} on date: {Date}", id, jobId, date);
            if (!DateTime.TryParse(date, out var occurrenceDate))
            {
                _logger.LogWarning("Invalid date format for completing assignment: {Date}", date);
                return BadRequest(new { message = "Invalid date format" });
            }

            var assignment = await _context.JobAssignments
                .FirstOrDefaultAsync(a => a.Id == id && a.JobId == jobId);

            if (assignment == null)
            {
                _logger.LogWarning("Assignment ID {Id} not found for job ID: {JobId}", id, jobId);
                return NotFound(new { message = "Assignment not found" });
            }

            var existingCompletion = await _context.JobCompletions
                .FirstOrDefaultAsync(cc => cc.JobAssignmentId == id && cc.OccurrenceDate.Date == occurrenceDate.Date);

            if (existingCompletion != null)
            {
                _logger.LogWarning("Assignment ID {Id} already completed for date: {Date}", id, occurrenceDate.Date);
                return BadRequest(new { message = "Assignment already completed for this date" });
            }

            var completion = new JobCompletion
            {
                JobId = jobId,
                JobAssignmentId = id,
                OccurrenceDate = occurrenceDate.Date,
                CompletedAt = DateTime.UtcNow,
                CompletedByUserId = assignment.UserId
            };

            _context.JobCompletions.Add(completion);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Completed assignment {Id} for job {JobId} on {Date}", id, jobId, occurrenceDate.Date);
            return Ok();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error completing assignment ID: {Id} for job ID: {JobId}", id, jobId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error completing assignment ID: {Id} for job ID: {JobId}", id, jobId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    // DELETE: api/jobs/{jobId}/assignments/{id}/complete
    [HttpDelete("{id}/complete")]
    public async Task<IActionResult> UncompleteAssignment(int jobId, int id, [FromQuery] string date)
    {
        try
        {
            _logger.LogDebug("Uncompleting assignment ID: {Id} for job ID: {JobId} on date: {Date}", id, jobId, date);
            if (!DateTime.TryParse(date, out var occurrenceDate))
            {
                _logger.LogWarning("Invalid date format for uncompleting assignment: {Date}", date);
                return BadRequest(new { message = "Invalid date format" });
            }

            var completion = await _context.JobCompletions
                .FirstOrDefaultAsync(cc => cc.JobAssignmentId == id && cc.OccurrenceDate.Date == occurrenceDate.Date);

            if (completion == null)
            {
                _logger.LogWarning("Completion not found for assignment ID: {Id} on date: {Date}", id, occurrenceDate.Date);
                return NotFound(new { message = "Completion not found" });
            }

            _context.JobCompletions.Remove(completion);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Uncompleted assignment {Id} for job {JobId} on {Date}", id, jobId, occurrenceDate.Date);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error uncompleting assignment ID: {Id} for job ID: {JobId}", id, jobId);
            return StatusCode(500, new { message = "Database error occurred" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error uncompleting assignment ID: {Id} for job ID: {JobId}", id, jobId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    private static JobAssignmentDto MapToDto(JobAssignment a, DateTime? occurrenceDate, JobCompletion? completion)
    {
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
            IsCompleted = completion != null,
            CompletedAt = completion?.CompletedAt
        };
    }
}
