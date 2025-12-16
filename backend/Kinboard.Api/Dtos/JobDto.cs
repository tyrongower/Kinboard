namespace Kinboard.Api.Dtos;

public class JobDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }

    // Recurrence settings (shared by all assignments when UseSharedRecurrence is true)
    public string? Recurrence { get; set; }
    public DateTime? RecurrenceStartDate { get; set; }
    public DateTime? RecurrenceEndDate { get; set; }
    public bool RecurrenceIndefinite { get; set; }
    
    // Multi-user assignment support
    public bool UseSharedRecurrence { get; set; } = true;
    public List<JobAssignmentDto> Assignments { get; set; } = new();
    
    // For recurring jobs: the specific occurrence date being displayed/toggled
    public DateTime? OccurrenceDate { get; set; }
}
