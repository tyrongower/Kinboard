namespace Kinboard.Api.Dtos;

public class JobAssignmentDto
{
    public int Id { get; set; }
    public int JobId { get; set; }
    public int UserId { get; set; }
    public UserDto? User { get; set; }
    
    // Individual recurrence settings (used when Job.UseSharedRecurrence is false)
    public string? Recurrence { get; set; }
    public DateTime? RecurrenceStartDate { get; set; }
    public DateTime? RecurrenceEndDate { get; set; }
    public bool RecurrenceIndefinite { get; set; }
    
    public int DisplayOrder { get; set; }
    
    // For tracking completion status on a specific occurrence date
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
}
