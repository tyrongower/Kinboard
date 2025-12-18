'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { performanceApi, type PerformanceMetricsResponse } from '@/lib/api';

type ChartType = 'latency' | 'throughput' | 'errors';
type TimeRange = '1h' | '6h' | '12h' | '24h';

export default function PerformanceAdmin() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<PerformanceMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [endpointFilter, setEndpointFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [chartType, setChartType] = useState<ChartType>('latency');

  const fetchMetrics = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const hours = parseInt(timeRange);
      const result = await performanceApi.getMetrics({
        startTime: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
        endTime: new Date().toISOString(),
        endpoint: endpointFilter || undefined,
        method: methodFilter || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [accessToken, timeRange, endpointFilter, methodFilter]);

  const exportToCsv = () => {
    if (!data || !data.endpoints.length) return;

    const headers = [
      'Endpoint',
      'Method',
      'Request Count',
      'Avg Response Time (ms)',
      'P50 (ms)',
      'P95 (ms)',
      'P99 (ms)',
      'Avg Dependency Time (ms)',
      'Error Rate (%)',
      'Throughput (req/min)',
      'Avg Query Count',
    ];

    const rows = data.endpoints.map((e) => [
      e.endpoint,
      e.method,
      e.requestCount,
      e.avgRequestTimeMs,
      e.p50RequestTimeMs,
      e.p95RequestTimeMs,
      e.p99RequestTimeMs,
      e.avgDependencyTimeMs,
      e.errorRate,
      e.throughputPerMinute,
      e.avgQueryCount,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getChartData = () => {
    if (!data || !data.endpoints.length) return null;

    const sortedEndpoints = [...data.endpoints].sort((a, b) => b.requestCount - a.requestCount).slice(0, 10);

    switch (chartType) {
      case 'latency':
        return {
          labels: sortedEndpoints.map((e) => `${e.method} ${e.endpoint}`),
          datasets: [
            { label: 'Avg', data: sortedEndpoints.map((e) => e.avgRequestTimeMs), color: '#3B82F6' },
            { label: 'P95', data: sortedEndpoints.map((e) => e.p95RequestTimeMs), color: '#F59E0B' },
            { label: 'P99', data: sortedEndpoints.map((e) => e.p99RequestTimeMs), color: '#EF4444' },
          ],
        };
      case 'throughput':
        return {
          labels: sortedEndpoints.map((e) => `${e.method} ${e.endpoint}`),
          datasets: [
            {
              label: 'Requests/min',
              data: sortedEndpoints.map((e) => e.throughputPerMinute),
              color: '#10B981',
            },
          ],
        };
      case 'errors':
        return {
          labels: sortedEndpoints.map((e) => `${e.method} ${e.endpoint}`),
          datasets: [{ label: 'Error Rate %', data: sortedEndpoints.map((e) => e.errorRate), color: '#EF4444' }],
        };
    }
  };

  const chartData = getChartData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
            Performance Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Monitor API request metrics and performance
          </p>
        </div>

        <button onClick={exportToCsv} className="btn btn-secondary" disabled={!data || !data.endpoints.length}>
          📊 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div
        className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div>
          <label className="label">
            Time Range
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="input select w-full"
          >
            <option value="1h">Last 1 Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="12h">Last 12 Hours</option>
            <option value="24h">Last 24 Hours</option>
          </select>
        </div>

        <div>
          <label className="label">
            Endpoint Filter
          </label>
          <input
            type="text"
            value={endpointFilter}
            onChange={(e) => setEndpointFilter(e.target.value)}
            placeholder="e.g., /api/jobs"
            className="input w-full"
          />
        </div>

        <div>
          <label className="label">
            Method Filter
          </label>
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="input select w-full">
            <option value="">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>

        <div>
          <label className="label">
            Chart Type
          </label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value as ChartType)} className="input select w-full">
            <option value="latency">Latency</option>
            <option value="throughput">Throughput</option>
            <option value="errors">Error Rate</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Total Requests
            </div>
            <div className="text-2xl font-semibold mt-2" style={{ color: 'var(--color-text)' }}>
              {data.totalRequests.toLocaleString()}
            </div>
          </div>

          <div className="card p-4">
            <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Endpoints
            </div>
            <div className="text-2xl font-semibold mt-2" style={{ color: 'var(--color-text)' }}>
              {data.endpoints.length}
            </div>
          </div>

          <div className="card p-4">
            <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Avg Response Time
            </div>
            <div className="text-2xl font-semibold mt-2" style={{ color: 'var(--color-text)' }}>
              {data.endpoints.length > 0
                ? Math.round(data.endpoints.reduce((sum, e) => sum + e.avgRequestTimeMs, 0) / data.endpoints.length)
                : 0}
              <span className="text-sm ml-1">ms</span>
            </div>
          </div>

          <div className="card p-4">
            <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Avg Error Rate
            </div>
            <div className="text-2xl font-semibold mt-2" style={{ color: 'var(--color-text)' }}>
              {data.endpoints.length > 0
                ? (data.endpoints.reduce((sum, e) => sum + e.errorRate, 0) / data.endpoints.length).toFixed(2)
                : 0}
              <span className="text-sm ml-1">%</span>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {loading && (
        <div className="card p-8 text-center">
          <div className="animate-pulse" style={{ color: 'var(--color-text-muted)' }}>Loading metrics...</div>
        </div>
      )}

      {error && (
        <div className="card p-4 border-l-4" style={{ borderColor: 'var(--color-error)' }}>
          <div style={{ color: 'var(--color-error)' }}>Error: {error}</div>
        </div>
      )}

      {!loading && !error && chartData && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Top 10 Endpoints - {chartType.charAt(0).toUpperCase() + chartType.slice(1)}
          </h2>
          <div className="space-y-4">
            {chartData.datasets.map((dataset, dsIndex) => (
              <div key={dsIndex}>
                <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  {dataset.label}
                </div>
                {chartData.labels.map((label, index) => {
                  const value = dataset.data[index];
                  const maxValue = Math.max(...dataset.data);
                  const widthPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;

                  return (
                    <div key={index} className="mb-3">
                      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                        <span className="truncate max-w-[70%]" title={label}>
                          {label}
                        </span>
                        <span className="font-mono">
                          {value.toFixed(2)}
                          {chartType === 'errors' ? '%' : chartType === 'throughput' ? ' req/m' : ' ms'}
                        </span>
                      </div>
                      <div className="w-full h-6 bg-gray-200 rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all duration-300"
                          style={{
                            width: `${widthPercent}%`,
                            backgroundColor: dataset.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Table */}
      {!loading && !error && data && data.endpoints.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-divider)' }}>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    Endpoint
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    Method
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    Requests
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    Avg (ms)
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    P95 (ms)
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    P99 (ms)
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    Error %
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    Queries
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.endpoints.map((endpoint, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                      <span className="font-mono text-xs">{endpoint.endpoint}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor:
                            endpoint.method === 'GET'
                              ? '#10B98120'
                              : endpoint.method === 'POST'
                              ? '#3B82F620'
                              : endpoint.method === 'PUT'
                              ? '#F59E0B20'
                              : endpoint.method === 'DELETE'
                              ? '#EF444420'
                              : '#6B728020',
                          color:
                            endpoint.method === 'GET'
                              ? '#059669'
                              : endpoint.method === 'POST'
                              ? '#2563EB'
                              : endpoint.method === 'PUT'
                              ? '#D97706'
                              : endpoint.method === 'DELETE'
                              ? '#DC2626'
                              : '#374151',
                        }}
                      >
                        {endpoint.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono" style={{ color: 'var(--color-text)' }}>
                      {endpoint.requestCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono" style={{ color: 'var(--color-text)' }}>
                      {endpoint.avgRequestTimeMs.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono" style={{ color: 'var(--color-text)' }}>
                      {endpoint.p95RequestTimeMs.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono" style={{ color: 'var(--color-text)' }}>
                      {endpoint.p99RequestTimeMs.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      <span
                        style={{
                          color: endpoint.errorRate > 5 ? '#EF4444' : endpoint.errorRate > 0 ? '#F59E0B' : '#10B981',
                        }}
                      >
                        {endpoint.errorRate.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono" style={{ color: 'var(--color-text)' }}>
                      {endpoint.avgQueryCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && data && data.endpoints.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p>No performance data available for the selected filters.</p>
        </div>
      )}
    </div>
  );
}
