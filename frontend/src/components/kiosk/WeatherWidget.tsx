'use client';

import { useState, useEffect } from 'react';
import { siteSettingsApi, SiteSettings } from '@/lib/api';

interface ForecastItem {
  date: string;
  avgTempC: number;
  minTempC: number;
  maxTempC: number;
  totalPrecipMm: number;
  chanceOfRainPercent: number;
  conditionIconUrl: string;
  conditionText?: string;
  maxWindKph?: number;
  avgHumidity?: number;
  uv?: number;
  sunrise?: string;
  sunset?: string;
  avgVisKm?: number;
  totalSnowCm?: number;
  dailyChanceOfSnow?: number;
  dailyWillItRain?: number;
}

interface WeatherData {
  currentTempC: number;
  feelsLikeC: number;
  conditionText: string;
  conditionIconUrl: string;
  humidity: number;
  windKph: number;
  todayMinTempC: number;
  todayMaxTempC: number;
  todayPrecipMm: number;
  tomorrowAvgTempC: number;
  tomorrowPrecipMm: number;
  forecast5: ForecastItem[];
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const s = await siteSettingsApi.get();
        setSettings(s);
      } catch { /* ignore */ }
    })();
    loadWeather();
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const sec = Math.max(300, settings?.weatherRefreshSeconds ?? 1800);
    const handle = setInterval(() => {
      loadWeather(true);
    }, sec * 1000);
    return () => clearInterval(handle);
  }, [settings?.weatherRefreshSeconds]);

  const loadWeather = async (silent = false) => {
    try {
      // Get access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      const headers: HeadersInit = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`/api/weather`, { headers });
      if (!response.ok) {
        setWeather(null);
        const text = await response.text();
        setError('Weather data unavailable');
        console.error('Weather error response:', text);
        return;
      }
      const data = await response.json();
      setError(null);
      setWeather(data);
    } catch (error) {
      console.error('Error loading weather:', error);
      setError('Weather data unavailable');
      setWeather(null);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

  const openReport = (idx = 0) => {
    setSelectedIndex(idx);
    setShowReport(true);
  };

  const closeReport = () => setShowReport(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Weather unavailable
        </span>
      </div>
    );
  }

  const formatDay = (iso: string) => {
    return new Date(iso + 'T00:00:00')
      .toLocaleDateString(undefined, { weekday: 'short' })
      .slice(0, 2);
  };

  const humidityPct = clamp(weather.humidity, 0, 100);
  const windPct = clamp((weather.windKph / 60) * 100, 0, 100);
  const rainPct = clamp((weather.todayPrecipMm / 20) * 100, 0, 100);

  return (
    <div
      className="flex items-center gap-2 px-2 py-1 rounded-lg border"
      style={{
        background: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-divider)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Current */}
      <div className="flex items-center gap-2">
        {weather.conditionIconUrl ? (
          <img
            src={weather.conditionIconUrl}
            alt={weather.conditionText || 'Weather'}
            className="w-8 h-8 object-contain"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg" style={{ background: 'var(--color-surface)' }} />
        )}

        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
              {Math.round(weather.currentTempC)}°
            </span>

          </div>
          <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
              feels {Math.round(weather.feelsLikeC)}°
            </span>
        </div>
      </div>

      {/* Next 3 days incl. today (fit-to-header) */}
      {weather.forecast5 && weather.forecast5.length > 0 && (
        <div className="flex items-center gap-1">
          {weather.forecast5.slice(0, 3).map((d, idx) => {
            const chance = clamp(d.chanceOfRainPercent ?? 0, 0, 100);
            return (
              <div
                key={idx}
                className="flex flex-col items-center gap-0.5 px-1.5 py-0.5 rounded-md border w-[56px] cursor-pointer flex-shrink-0"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
                onClick={() => openReport(idx)}
              >
                <div className="text-[10px] whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                  {formatDay(d.date)}
                </div>

                {d.conditionIconUrl ? (
                  <img src={d.conditionIconUrl} alt="" className="w-5 h-5 object-contain" />
                ) : (
                  <div className="w-5 h-5 rounded" style={{ background: 'var(--color-bg-elevated)' }} />
                )}

                <div className="text-[10px] leading-none tabular-nums whitespace-nowrap" style={{ color: 'var(--color-text)' }}>
                  {Math.round(d.minTempC)}°/{Math.round(d.maxTempC)}°
                </div>

                <div className="text-[10px] leading-none tabular-nums whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                  💧{chance}%
                </div>
              </div>
            );
          })}
        </div>
      )}

      <span
        className="text-xs tabular-nums ml-auto"
        style={{ color: 'var(--color-text-muted)' }}
        suppressHydrationWarning
      >
        {time ? formatTime(time) : ''}
      </span>

      {/* Full weather report modal */}
      {showReport && weather.forecast5 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'color-mix(in oklab, var(--color-bg) 60%, transparent)' as any }}
          onClick={closeReport}
        >
          <div
            className="w-[92vw] max-w-3xl max-h-[85vh] rounded-xl border shadow-xl overflow-hidden"
            style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-divider)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-divider)' }}>
              <div className="flex items-center gap-2">
                {weather.conditionIconUrl && (
                  <img src={weather.conditionIconUrl} alt="" className="w-6 h-6 object-contain" />
                )}
                <div className="font-semibold" style={{ color: 'var(--color-text)' }}>Weather report</div>
              </div>
              <button onClick={closeReport} className="px-2 py-1 text-sm rounded-md border" style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-secondary)' }}>Close</button>
            </div>
            <div className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 48px)' }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {weather.forecast5.slice(0, 3).map((d, idx) => {
                  const active = idx === selectedIndex;
                  const chance = clamp(d.chanceOfRainPercent ?? 0, 0, 100);
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col gap-2 rounded-lg border p-3 ${active ? 'ring-1' : ''}`}
                      style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text)' }}
                      onClick={() => setSelectedIndex(idx)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{formatDay(d.date)}</div>
                        {d.conditionIconUrl && <img src={d.conditionIconUrl} alt="" className="w-6 h-6 object-contain" />}
                      </div>
                      <div className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                        {Math.round(d.minTempC)}° / {Math.round(d.maxTempC)}°
                      </div>
                      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {d.conditionText || ''}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[12px] tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                        <div>💧 Humidity: {d.avgHumidity ?? 0}%</div>
                        <div>💨 Wind: {Math.round(d.maxWindKph ?? 0)} kph</div>
                        <div>🌧️ Chance: {chance}%</div>
                        <div>☀️ UV: {d.uv ?? 0}</div>
                        {d.sunrise && <div>🌅 Sunrise: {d.sunrise}</div>}
                        {d.sunset && <div>🌇 Sunset: {d.sunset}</div>}
                        {d.avgVisKm !== undefined && <div>👁️ Vis: {(d.avgVisKm ?? 0).toFixed(1)} km</div>}
                        {d.totalSnowCm !== undefined && (d.totalSnowCm ?? 0) > 0 && <div>❄️ Snow: {(d.totalSnowCm ?? 0).toFixed(1)} cm</div>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Current conditions summary */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px] tabular-nums">
                <div className="rounded-md border p-2" style={{ borderColor: 'var(--color-divider)' }}>Now: {Math.round(weather.currentTempC)}° (feels {Math.round(weather.feelsLikeC)}°)</div>
                <div className="rounded-md border p-2" style={{ borderColor: 'var(--color-divider)' }}>Humidity: {clamp(weather.humidity,0,100)}%</div>
                <div className="rounded-md border p-2" style={{ borderColor: 'var(--color-divider)' }}>Wind: {Math.round(weather.windKph)} kph</div>
                <div className="rounded-md border p-2" style={{ borderColor: 'var(--color-divider)' }}>Rain today: {weather.todayPrecipMm.toFixed(1)} mm</div>
              </div>

              <div className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Tip: Most relevant info is at the top. Scroll for additional details.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
