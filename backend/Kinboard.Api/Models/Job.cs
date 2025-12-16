namespace Kinboard.Api.Models;

public class Job
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Recurrence settings (shared by all assignments when UseSharedRecurrence is true)
    public string? Recurrence { get; set; } // RRULE-like: FREQ=DAILY;INTERVAL=3 or FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TH,SU
    public DateTime? RecurrenceStartDate { get; set; } // Start date for recurrence evaluation
    public DateTime? RecurrenceEndDate { get; set; } // null when indefinite
    public bool RecurrenceIndefinite { get; set; } // true => ignore end date
    
    // Multi-user assignment support
    public bool UseSharedRecurrence { get; set; } = true; // true = all assignments use job's recurrence; false = each assignment has its own
    public ICollection<JobAssignment> Assignments { get; set; } = new List<JobAssignment>();
}
