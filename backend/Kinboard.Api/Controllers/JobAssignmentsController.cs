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
        var job = await _context.Jobs.FindAsync(jobId);
        if (job == null)
        {
            return NotFound("Job not found");
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

        return Ok(assignments.Select(a => MapToDto(a, occurrenceDate, completions?.FirstOrDefault(c => c.JobAssignmentId == a.Id))));
    }

    // GET: api/jobs/{jobId}/assignments/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<JobAssignmentDto>> GetAssignment(int jobId, int id, [FromQuery] string? date = null)
    {
        var assignment = await _context.JobAssignments
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == id && a.JobId == jobId);

        if (assignment == null)
        {
            return NotFound();
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

    // POST: api/jobs/{jobId}/assignments
    [HttpPost]
    public async Task<ActionResult<JobAssignmentDto>> CreateAssignment(int jobId, JobAssignmentDto dto)
    {
        try
        {
            var job = await _context.Jobs.FindAsync(jobId);
            if (job == null)
            {
                return NotFound("Job not found");
            }

            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
            {
                return BadRequest("User not found");
            }

            // Check if assignment already exists for this user
            var existingAssignment = await _context.JobAssignments
                .FirstOrDefaultAsync(a => a.JobId == jobId && a.UserId == dto.UserId);
            if (existingAssignment != null)
            {
                return BadRequest("User is already assigned to this job");
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating assignment for job {JobId}", jobId);
            throw;
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
                return BadRequest("ID mismatch");
            }

            var assignment = await _context.JobAssignments
                .FirstOrDefaultAsync(a => a.Id == id && a.JobId == jobId);

            if (assignment == null)
            {
                return NotFound();
            }

            // If changing user, check for duplicate
            if (assignment.UserId != dto.UserId)
            {
                var existingAssignment = await _context.JobAssignments
                    .FirstOrDefaultAsync(a => a.JobId == jobId && a.UserId == dto.UserId && a.Id != id);
                if (existingAssignment != null)
                {
                    return BadRequest("User is already assigned to this job");
                }

                var user = await _context.Users.FindAsync(dto.UserId);
                if (user == null)
                {
                    return BadRequest("User not found");
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating assignment {Id} for job {JobId}", id, jobId);
            throw;
        }
    }

    // DELETE: api/jobs/{jobId}/assignments/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAssignment(int jobId, int id)
    {
        try
        {
            var assignment = await _context.JobAssignments
                .FirstOrDefaultAsync(a => a.Id == id && a.JobId == jobId);

            if (assignment == null)
            {
                return NotFound();
            }

            _context.JobAssignments.Remove(assignment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted assignment {Id} for job {JobId}", id, jobId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting assignment {Id} for job {JobId}", id, jobId);
            throw;
        }
    }

    // PUT: api/jobs/{jobId}/assignments/order
    [HttpPut("order")]
    public async Task<IActionResult> UpdateOrder(int jobId, [FromBody] int[] assignmentIds)
    {
        try
        {
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating assignment order for job {JobId}", jobId);
            throw;
        }
    }

    // POST: api/jobs/{jobId}/assignments/{id}/complete
    [HttpPost("{id}/complete")]
    public async Task<IActionResult> CompleteAssignment(int jobId, int id, [FromQuery] string date)
    {
        try
        {
            if (!DateTime.TryParse(date, out var occurrenceDate))
            {
                return BadRequest("Invalid date format");
            }

            var assignment = await _context.JobAssignments
                .FirstOrDefaultAsync(a => a.Id == id && a.JobId == jobId);

            if (assignment == null)
            {
                return NotFound();
            }

            var existingCompletion = await _context.JobCompletions
                .FirstOrDefaultAsync(cc => cc.JobAssignmentId == id && cc.OccurrenceDate.Date == occurrenceDate.Date);

            if (existingCompletion != null)
            {
                return BadRequest("Assignment already completed for this date");
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing assignment {Id} for job {JobId}", id, jobId);
            throw;
        }
    }

    // DELETE: api/jobs/{jobId}/assignments/{id}/complete
    [HttpDelete("{id}/complete")]
    public async Task<IActionResult> UncompleteAssignment(int jobId, int id, [FromQuery] string date)
    {
        try
        {
            if (!DateTime.TryParse(date, out var occurrenceDate))
            {
                return BadRequest("Invalid date format");
            }

            var completion = await _context.JobCompletions
                .FirstOrDefaultAsync(cc => cc.JobAssignmentId == id && cc.OccurrenceDate.Date == occurrenceDate.Date);

            if (completion == null)
            {
                return NotFound("Completion not found");
            }

            _context.JobCompletions.Remove(completion);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Uncompleted assignment {Id} for job {JobId} on {Date}", id, jobId, occurrenceDate.Date);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uncompleting assignment {Id} for job {JobId}", id, jobId);
            throw;
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
