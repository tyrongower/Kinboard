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
      const response = await fetch(`/api/weather`);
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
            <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
              feels {Math.round(weather.feelsLikeC)}°
            </span>
          </div>
          <span className="text-[11px] tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
            {Math.round(weather.todayMinTempC)}° / {Math.round(weather.todayMaxTempC)}°
          </span>
        </div>
      </div>

      {/* Today metrics (compressed) */}
      <div className="flex items-center gap-2 text-[11px] tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
        <span title="Humidity">💧{humidityPct}%</span>
        <span title="Wind">💨{Math.round(weather.windKph)}kph</span>
        <span title="Rain today">🌧️{weather.todayPrecipMm.toFixed(1)}mm</span>
      </div>

      {/* Next 4 days (fit-to-header) */}
      {weather.forecast5 && weather.forecast5.length > 0 && (
        <div className="flex items-center gap-1">
          {weather.forecast5.slice(0, 4).map((d, idx) => {
            const chance = clamp(d.chanceOfRainPercent ?? 0, 0, 100);
            return (
              <div
                key={idx}
                className="flex flex-col items-center gap-0.5 px-1 py-0.5 rounded-md border w-[44px]"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {formatDay(d.date)}
                </div>

                {d.conditionIconUrl ? (
                  <img src={d.conditionIconUrl} alt="" className="w-5 h-5 object-contain" />
                ) : (
                  <div className="w-5 h-5 rounded" style={{ background: 'var(--color-bg-elevated)' }} />
                )}

                <div className="text-[10px] leading-none tabular-nums" style={{ color: 'var(--color-text)' }}>
                  {Math.round(d.minTempC)}°/{Math.round(d.maxTempC)}°
                </div>

                <div className="text-[10px] leading-none tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
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
    </div>
  );
}
