using System.Collections.Concurrent;
using Kinboard.Api.Models;

namespace Kinboard.Api.Services;

public class PerformanceStorage
{
    private static readonly ConcurrentQueue<PerformanceMetric> _metrics = new();
    private static readonly object _pruneLock = new();

    public void AddMetric(PerformanceMetric metric)
    {
        _metrics.Enqueue(metric);
    }

    public IEnumerable<PerformanceMetric> GetMetrics(
        DateTime? startTime = null,
        DateTime? endTime = null,
        string? endpoint = null,
        string? method = null,
        int? statusCodeMin = null,
        int? statusCodeMax = null)
    {
        var start = startTime ?? DateTime.UtcNow.AddHours(-24);
        var end = endTime ?? DateTime.UtcNow;

        return _metrics.Where(m =>
            m.Timestamp >= start &&
            m.Timestamp <= end &&
            (string.IsNullOrEmpty(endpoint) || m.Endpoint.Contains(endpoint, StringComparison.OrdinalIgnoreCase)) &&
            (string.IsNullOrEmpty(method) || m.Method.Equals(method, StringComparison.OrdinalIgnoreCase)) &&
            (!statusCodeMin.HasValue || m.StatusCode >= statusCodeMin.Value) &&
            (!statusCodeMax.HasValue || m.StatusCode <= statusCodeMax.Value)
        ).ToList();
    }

    public void PruneOldMetrics()
    {
        lock (_pruneLock)
        {
            var cutoffTime = DateTime.UtcNow.AddHours(-24);
            var itemsToRemove = 0;

            // Count how many old items to remove
            foreach (var metric in _metrics)
            {
                if (metric.Timestamp < cutoffTime)
                    itemsToRemove++;
                else
                    break; // Queue is ordered by time, so we can stop
            }

            // Remove old items
            for (var i = 0; i < itemsToRemove; i++)
            {
                _metrics.TryDequeue(out _);
            }
        }
    }

    public int GetCount() => _metrics.Count;
}
