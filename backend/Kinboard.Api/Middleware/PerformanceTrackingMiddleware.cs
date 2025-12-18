using System.Diagnostics;
using Kinboard.Api.Models;
using Kinboard.Api.Services;

namespace Kinboard.Api.Middleware;

public class PerformanceTrackingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly PerformanceStorage _storage;
    private readonly ILogger<PerformanceTrackingMiddleware> _logger;

    public PerformanceTrackingMiddleware(
        RequestDelegate next,
        PerformanceStorage storage,
        ILogger<PerformanceTrackingMiddleware> logger)
    {
        _next = next;
        _storage = storage;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip tracking for certain paths
        var path = context.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/openapi", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/scalar", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".js", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".css", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".map", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        var queryMetrics = new QueryMetrics();
        QueryTrackingInterceptor.CurrentMetrics = queryMetrics;

        var stopwatch = Stopwatch.StartNew();

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();

            var metric = new PerformanceMetric
            {
                Timestamp = DateTime.UtcNow,
                Endpoint = path,
                Method = context.Request.Method,
                StatusCode = context.Response.StatusCode,
                RequestDurationMs = stopwatch.Elapsed.TotalMilliseconds,
                DependencyDurationMs = queryMetrics.TotalQueryTimeMs,
                QueryCount = queryMetrics.QueryCount
            };

            _storage.AddMetric(metric);

            QueryTrackingInterceptor.CurrentMetrics = null;
        }
    }
}
