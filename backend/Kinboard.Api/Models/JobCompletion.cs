namespace Kinboard.Api.Models;

public class JobCompletion
{
    public int Id { get; set; }
    public int JobId { get; set; }
    public Job Job { get; set; } = null!;
    public DateTime OccurrenceDate { get; set; } // The specific date this job occurred (just the date part)
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    public int? CompletedByUserId { get; set; }
    public User? CompletedBy { get; set; }
    
    // Optional link to specific assignment (for per-user completion tracking)
    public int? JobAssignmentId { get; set; }
    public JobAssignment? JobAssignment { get; set; }
}
