'use client';

import { useEffect, useState } from 'react';
import { SiteSettings, siteSettingsApi } from '@/lib/api';

// SVG Icons as components
const IconSave = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export default function SiteSettingsAdmin() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const setts = await siteSettingsApi.get();
      setSettings(setts);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    try {
      await siteSettingsApi.update(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e?.message || 'Failed to save settings');
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Section Header */}
      <div className="section-header">
        <h2 className="section-title">Site Settings</h2>
        <button className="btn btn-primary" onClick={saveSettings}>
          <IconSave />
          <span>{saved ? 'Saved!' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mb-4 p-3 rounded-lg"
          style={{ background: 'var(--color-error-muted)', color: 'var(--color-error)' }}
        >
          {error}
        </div>
      )}

      {/* Success Message */}
      {saved && (
        <div
          className="mb-4 p-3 rounded-lg"
          style={{ background: 'var(--color-success-muted)', color: 'var(--color-success)' }}
        >
          Settings saved successfully!
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Calendar Settings */}
        <div className="card p-6">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Calendar Settings
          </h3>

          <div className="flex flex-col gap-4">
            {/* Default View */}
            <div className="form-group">
              <label className="label">Default Calendar View</label>
              <select
                className="input select"
                value={settings?.defaultView ?? 'Day'}
                onChange={(e) => setSettings(s => s ? { ...s, defaultView: e.target.value as any } : s)}
              >
                <option value="Day">Day</option>
                <option value="Week">Week</option>
                <option value="Month">Month</option>
              </select>
            </div>

            {/* Completion Mode */}
            <div className="form-group">
              <label className="label">Completion Pills Range</label>
              <select
                className="input select"
                value={settings?.completionMode ?? 'Today'}
                onChange={(e) => setSettings(s => s ? { ...s, completionMode: e.target.value as any } : s)}
              >
                <option value="Today">Today only</option>
                <option value="VisibleRange">Current view range</option>
              </select>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Controls which date range is used for showing completion status
              </p>
            </div>
          </div>
        </div>

        {/* Refresh Intervals */}
        <div className="card p-6">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Refresh Intervals
          </h3>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {/* Jobs Refresh */}
            <div className="form-group">
              <label className="label">Jobs Refresh</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input"
                  min={5}
                  max={3600}
                  value={settings?.jobsRefreshSeconds ?? 10}
                  onChange={(e) => {
                    const v = Math.max(5, Math.min(3600, Number(e.target.value || 0)));
                    setSettings(s => s ? { ...s, jobsRefreshSeconds: v } : s);
                  }}
                />
                <span style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>seconds</span>
              </div>
            </div>

            {/* Calendar Refresh */}
            <div className="form-group">
              <label className="label">Calendar Refresh</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input"
                  min={5}
                  max={3600}
                  value={settings?.calendarRefreshSeconds ?? 30}
                  onChange={(e) => {
                    const v = Math.max(5, Math.min(3600, Number(e.target.value || 0)));
                    setSettings(s => s ? { ...s, calendarRefreshSeconds: v } : s);
                  }}
                />
                <span style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>seconds</span>
              </div>
            </div>

            {/* Weather Refresh */}
            <div className="form-group">
              <label className="label">Weather Refresh</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input"
                  min={3}
                  max={1440}
                  value={Math.round((settings?.weatherRefreshSeconds ?? 1800) / 60)}
                  onChange={(e) => {
                    const minutes = Math.max(3, Math.min(24 * 60, Number(e.target.value || 0)));
                    setSettings(s => s ? { ...s, weatherRefreshSeconds: minutes * 60 } : s);
                  }}
                />
                <span style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weather API Settings */}
        <div className="card p-6">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Weather API
          </h3>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {/* API Key */}
            <div className="form-group">
              <label className="label">API Key</label>
              <input
                type="password"
                className="input"
                value={settings?.weatherApiKey ?? ''}
                onChange={(e) => setSettings(s => s ? { ...s, weatherApiKey: e.target.value } : s)}
                placeholder="Enter your weather API key"
              />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Get a free API key from OpenWeatherMap
              </p>
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="label">Location</label>
              <input
                type="text"
                className="input"
                value={settings?.weatherLocation ?? ''}
                onChange={(e) => setSettings(s => s ? { ...s, weatherLocation: e.target.value } : s)}
                placeholder="e.g. New York, USA"
              />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                City name for weather display
              </p>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="card p-6">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Email Notifications (Mailgun)
          </h3>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {/* API Key */}
            <div className="form-group">
              <label className="label">Mailgun API Key</label>
              <input
                type="password"
                className="input"
                value={settings?.mailgunApiKey ?? ''}
                onChange={(e) => setSettings(s => s ? { ...s, mailgunApiKey: e.target.value } : s)}
                placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>

            {/* Domain */}
            <div className="form-group">
              <label className="label">Mailgun Domain</label>
              <input
                type="text"
                className="input"
                value={settings?.mailgunDomain ?? ''}
                onChange={(e) => setSettings(s => s ? { ...s, mailgunDomain: e.target.value } : s)}
                placeholder="mg.yourdomain.com"
              />
            </div>

            {/* From Email */}
            <div className="form-group">
              <label className="label">From Email Address</label>
              <input
                type="email"
                className="input"
                value={settings?.mailgunFromEmail ?? ''}
                onChange={(e) => setSettings(s => s ? { ...s, mailgunFromEmail: e.target.value } : s)}
                placeholder="Kinboard <noreply@yourdomain.com>"
              />
            </div>

            {/* Site URL */}
            <div className="form-group">
              <label className="label">Site Public URL</label>
              <input
                type="url"
                className="input"
                value={settings?.siteUrl ?? ''}
                onChange={(e) => setSettings(s => s ? { ...s, siteUrl: e.target.value } : s)}
                placeholder="https://kinboard.yourdomain.com"
              />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Used in email notifications for links back to the site
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
