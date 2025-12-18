using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Kinboard.Api.Dtos;
using Kinboard.Api.Services;

namespace Kinboard.Api.Controllers;

[ApiController]
[Route("api/perf")]
[Authorize(Roles = "admin")]
public class PerformanceController : ControllerBase
{
    private readonly PerformanceStorage _storage;
    private readonly ILogger<PerformanceController> _logger;

    public PerformanceController(
        PerformanceStorage storage,
        ILogger<PerformanceController> logger)
    {
        _storage = storage;
        _logger = logger;
    }

    [HttpGet("data")]
    public ActionResult<PerformanceMetricsResponse> GetMetrics(
        [FromQuery] DateTime? startTime,
        [FromQuery] DateTime? endTime,
        [FromQuery] string? endpoint,
        [FromQuery] string? method,
        [FromQuery] int? statusCodeMin,
        [FromQuery] int? statusCodeMax)
    {
        try
        {
            _logger.LogDebug("Fetching performance metrics - StartTime: {StartTime}, EndTime: {EndTime}, Endpoint: {Endpoint}, Method: {Method}, StatusCodeMin: {StatusCodeMin}, StatusCodeMax: {StatusCodeMax}",
                startTime, endTime, endpoint ?? "all", method ?? "all", statusCodeMin, statusCodeMax);

            var start = startTime ?? DateTime.UtcNow.AddHours(-24);
            var end = endTime ?? DateTime.UtcNow;

            // Validate date range
            if (start > end)
            {
                _logger.LogWarning("Invalid date range: start time {StartTime} is after end time {EndTime}", start, end);
                return BadRequest(new { message = "Start time must be before end time" });
            }

            var metrics = _storage.GetMetrics(start, end, endpoint, method, statusCodeMin, statusCodeMax);
            var metricsList = metrics.ToList();

            if (!metricsList.Any())
            {
                _logger.LogInformation("No performance metrics found for the specified filters - StartTime: {StartTime}, EndTime: {EndTime}", start, end);
                return Ok(new PerformanceMetricsResponse
                {
                    StartTime = start,
                    EndTime = end,
                    TotalRequests = 0,
                    Endpoints = new List<EndpointMetrics>()
                });
            }

            _logger.LogDebug("Processing {Count} raw performance metrics", metricsList.Count);

            var totalMinutes = (end - start).TotalMinutes;
            if (totalMinutes < 1) totalMinutes = 1;

            var grouped = metricsList
                .GroupBy(m => new { m.Endpoint, m.Method })
                .Select(g =>
                {
                    var list = g.OrderBy(m => m.RequestDurationMs).ToList();
                    var count = list.Count;
                    var errorCount = list.Count(m => m.StatusCode >= 400);

                    return new EndpointMetrics
                    {
                        Endpoint = g.Key.Endpoint,
                        Method = g.Key.Method,
                        RequestCount = count,
                        AvgRequestTimeMs = Math.Round(list.Average(m => m.RequestDurationMs), 2),
                        P50RequestTimeMs = Math.Round(GetPercentile(list.Select(m => m.RequestDurationMs).ToList(), 50), 2),
                        P95RequestTimeMs = Math.Round(GetPercentile(list.Select(m => m.RequestDurationMs).ToList(), 95), 2),
                        P99RequestTimeMs = Math.Round(GetPercentile(list.Select(m => m.RequestDurationMs).ToList(), 99), 2),
                        AvgDependencyTimeMs = Math.Round(list.Average(m => m.DependencyDurationMs), 2),
                        ErrorRate = Math.Round((double)errorCount / count * 100, 2),
                        ThroughputPerMinute = Math.Round(count / totalMinutes, 2),
                        AvgQueryCount = (int)Math.Round(list.Average(m => m.QueryCount))
                    };
                })
                .OrderByDescending(e => e.RequestCount)
                .ToList();

            _logger.LogInformation("Retrieved performance metrics - TotalRequests: {TotalRequests}, UniqueEndpoints: {UniqueEndpoints}, TimeRange: {StartTime} to {EndTime}",
                metricsList.Count, grouped.Count, start, end);

            return Ok(new PerformanceMetricsResponse
            {
                StartTime = start,
                EndTime = end,
                TotalRequests = metricsList.Count,
                Endpoints = grouped
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving performance metrics - StartTime: {StartTime}, EndTime: {EndTime}, Endpoint: {Endpoint}, Method: {Method}",
                startTime, endTime, endpoint ?? "all", method ?? "all");
            return StatusCode(500, new { message = "Error retrieving performance metrics" });
        }
    }

    private static double GetPercentile(List<double> sortedValues, int percentile)
    {
        if (!sortedValues.Any()) return 0;

        sortedValues.Sort();
        var index = (int)Math.Ceiling(percentile / 100.0 * sortedValues.Count) - 1;
        if (index < 0) index = 0;
        if (index >= sortedValues.Count) index = sortedValues.Count - 1;

        return sortedValues[index];
    }
}
