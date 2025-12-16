namespace Kinboard.Api.Models;

public class JobAssignment
{
    public int Id { get; set; }
    
    // Foreign key to the parent Job
    public int JobId { get; set; }
    public Job Job { get; set; } = null!;
    
    // Foreign key to the assigned User
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    
    // Individual recurrence settings (used when Job.UseSharedRecurrence is false)
    public string? Recurrence { get; set; } // RRULE-like: FREQ=DAILY;INTERVAL=3 or FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TH,SU
    public DateTime? RecurrenceStartDate { get; set; }
    public DateTime? RecurrenceEndDate { get; set; }
    public bool RecurrenceIndefinite { get; set; }
    
    // Display order for this assignment within the job
    public int DisplayOrder { get; set; } = 0;
    
    // Navigation property for completions specific to this assignment
    public ICollection<JobCompletion> Completions { get; set; } = new List<JobCompletion>();
}
