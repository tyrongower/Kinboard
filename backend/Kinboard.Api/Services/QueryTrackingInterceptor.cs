using System.Data.Common;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Kinboard.Api.Services;

public class QueryTrackingInterceptor : DbCommandInterceptor
{
    private static readonly AsyncLocal<QueryMetrics> _currentMetrics = new();

    public static QueryMetrics? CurrentMetrics
    {
        get => _currentMetrics.Value;
        set => _currentMetrics.Value = value;
    }

    public override InterceptionResult<DbDataReader> ReaderExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<DbDataReader> result)
    {
        var metrics = CurrentMetrics;
        if (metrics != null)
        {
            metrics.Stopwatch.Start();
        }
        return result;
    }

    public override DbDataReader ReaderExecuted(
        DbCommand command,
        CommandExecutedEventData eventData,
        DbDataReader result)
    {
        var metrics = CurrentMetrics;
        if (metrics != null && metrics.Stopwatch.IsRunning)
        {
            metrics.Stopwatch.Stop();
            metrics.TotalQueryTimeMs += metrics.Stopwatch.Elapsed.TotalMilliseconds;
            metrics.QueryCount++;
            metrics.Stopwatch.Reset();
        }
        return result;
    }

    public override async ValueTask<DbDataReader> ReaderExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        DbDataReader result,
        CancellationToken cancellationToken = default)
    {
        var metrics = CurrentMetrics;
        if (metrics != null && metrics.Stopwatch.IsRunning)
        {
            metrics.Stopwatch.Stop();
            metrics.TotalQueryTimeMs += metrics.Stopwatch.Elapsed.TotalMilliseconds;
            metrics.QueryCount++;
            metrics.Stopwatch.Reset();
        }
        return result;
    }

    public override InterceptionResult<int> NonQueryExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<int> result)
    {
        var metrics = CurrentMetrics;
        if (metrics != null)
        {
            metrics.Stopwatch.Start();
        }
        return result;
    }

    public override int NonQueryExecuted(
        DbCommand command,
        CommandExecutedEventData eventData,
        int result)
    {
        var metrics = CurrentMetrics;
        if (metrics != null && metrics.Stopwatch.IsRunning)
        {
            metrics.Stopwatch.Stop();
            metrics.TotalQueryTimeMs += metrics.Stopwatch.Elapsed.TotalMilliseconds;
            metrics.QueryCount++;
            metrics.Stopwatch.Reset();
        }
        return result;
    }

    public override async ValueTask<int> NonQueryExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        int result,
        CancellationToken cancellationToken = default)
    {
        var metrics = CurrentMetrics;
        if (metrics != null && metrics.Stopwatch.IsRunning)
        {
            metrics.Stopwatch.Stop();
            metrics.TotalQueryTimeMs += metrics.Stopwatch.Elapsed.TotalMilliseconds;
            metrics.QueryCount++;
            metrics.Stopwatch.Reset();
        }
        return result;
    }

    public override InterceptionResult<object> ScalarExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<object> result)
    {
        var metrics = CurrentMetrics;
        if (metrics != null)
        {
            metrics.Stopwatch.Start();
        }
        return result;
    }

    public override object ScalarExecuted(
        DbCommand command,
        CommandExecutedEventData eventData,
        object result)
    {
        var metrics = CurrentMetrics;
        if (metrics != null && metrics.Stopwatch.IsRunning)
        {
            metrics.Stopwatch.Stop();
            metrics.TotalQueryTimeMs += metrics.Stopwatch.Elapsed.TotalMilliseconds;
            metrics.QueryCount++;
            metrics.Stopwatch.Reset();
        }
        return result;
    }

    public override async ValueTask<object> ScalarExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        object result,
        CancellationToken cancellationToken = default)
    {
        var metrics = CurrentMetrics;
        if (metrics != null && metrics.Stopwatch.IsRunning)
        {
            metrics.Stopwatch.Stop();
            metrics.TotalQueryTimeMs += metrics.Stopwatch.Elapsed.TotalMilliseconds;
            metrics.QueryCount++;
            metrics.Stopwatch.Reset();
        }
        return result;
    }
}

public class QueryMetrics
{
    public Stopwatch Stopwatch { get; } = new();
    public double TotalQueryTimeMs { get; set; }
    public int QueryCount { get; set; }
}
