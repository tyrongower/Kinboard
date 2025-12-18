namespace Kinboard.Api.Dtos;

public class PerformanceMetricsResponse
{
    public List<EndpointMetrics> Endpoints { get; set; } = new();
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int TotalRequests { get; set; }
}

public class EndpointMetrics
{
    public string Endpoint { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public int RequestCount { get; set; }
    public double AvgRequestTimeMs { get; set; }
    public double P50RequestTimeMs { get; set; }
    public double P95RequestTimeMs { get; set; }
    public double P99RequestTimeMs { get; set; }
    public double AvgDependencyTimeMs { get; set; }
    public double ErrorRate { get; set; }
    public double ThroughputPerMinute { get; set; }
    public int AvgQueryCount { get; set; }
}
