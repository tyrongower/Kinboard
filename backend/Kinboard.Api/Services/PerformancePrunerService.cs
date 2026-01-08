namespace Kinboard.Api.Services;

public class PerformancePrunerService : BackgroundService
{
    private readonly ILogger<PerformancePrunerService> _logger;
    private readonly PerformanceStorage _storage;
    private readonly TimeSpan _pruneInterval = TimeSpan.FromMinutes(5);

    public PerformancePrunerService(
        ILogger<PerformancePrunerService> logger,
        PerformanceStorage storage)
    {
        _logger = logger;
        _storage = storage;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Performance Pruner Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(_pruneInterval, stoppingToken);

                var countBefore = _storage.GetCount();
                _storage.PruneOldMetrics();
                var countAfter = _storage.GetCount();

                if (countBefore != countAfter)
                {
                    _logger.LogInformation(
                        "Pruned {Count} old performance metrics. Remaining: {Remaining}",
                        countBefore - countAfter,
                        countAfter);
                }
            }
            catch (OperationCanceledException)
            {
                // Expected when stopping
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error pruning performance metrics");
            }
        }

        _logger.LogInformation("Performance Pruner Service stopped");
    }
}
