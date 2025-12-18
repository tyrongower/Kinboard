namespace Kinboard.Api.Models;

public class PerformanceMetric
{
    public DateTime Timestamp { get; set; }
    public string Endpoint { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public double RequestDurationMs { get; set; }
    public double DependencyDurationMs { get; set; }
    public int QueryCount { get; set; }
}
