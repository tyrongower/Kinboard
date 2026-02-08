'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatDateForApi } from '@/lib/dateUtils';

type Frequency = 'DAILY' | 'WEEKLY';

const DayCodes: { code: string; label: string }[] = [
  { code: 'MO', label: 'Mon' },
  { code: 'TU', label: 'Tue' },
  { code: 'WE', label: 'Wed' },
  { code: 'TH', label: 'Thu' },
  { code: 'FR', label: 'Fri' },
  { code: 'SA', label: 'Sat' },
  { code: 'SU', label: 'Sun' },
];

function formatDateInput(d?: string | null) {
  if (!d) return '';
  return formatDateForApi(new Date(d));
}

function parseRRule(rrule: string | undefined) {
  const result: {
    freq: Frequency;
    interval: number;
    byday: string[];
  } = { freq: 'DAILY', interval: 1, byday: [] };
  if (!rrule) return result;
  const parts = rrule
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean);
  const map: Record<string, string> = {};
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (!k || v === undefined) continue;
    map[k.trim().toUpperCase()] = v.trim();
  }
  const freq = (map['FREQ'] || '').toUpperCase();
  if (freq === 'WEEKLY') result.freq = 'WEEKLY';
  else if (freq === 'DAILY') result.freq = 'DAILY';
  const interval = parseInt(map['INTERVAL'] || '1', 10);
  result.interval = isNaN(interval) || interval <= 0 ? 1 : interval;
  const byday = (map['BYDAY'] || '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => DayCodes.some((d) => d.code === s));
  result.byday = byday;
  return result;
}

function buildRRule(freq: Frequency, interval: number, byday: string[]) {
  const parts = [`FREQ=${freq}`, `INTERVAL=${Math.max(1, Math.floor(interval || 1))}`];
  if (freq === 'WEEKLY' && byday.length > 0) {
    parts.push(`BYDAY=${byday.join(',')}`);
  }
  return parts.join(';');
}

export interface RecurrenceValue {
  recurrence: string;
  startDate: string | null;
  endDate: string | null;
  indefinite: boolean;
}

export default function RecurrenceModal(props: {
  open: boolean;
  onClose: () => void;
  value: RecurrenceValue;
  onSave: (val: RecurrenceValue) => void;
}) {
  const { open, onClose, value, onSave } = props;

  const parsed = useMemo(() => parseRRule(value?.recurrence || ''), [value?.recurrence]);
  const [freq, setFreq] = useState<Frequency>(parsed.freq);
  const [interval, setInterval] = useState<number>(parsed.interval);
  const [byday, setByday] = useState<string[]>(parsed.byday);
  const [startDate, setStartDate] = useState<string | null>(value?.startDate || null);
  const [indefinite, setIndefinite] = useState<boolean>(Boolean(value?.indefinite));
  const [endDate, setEndDate] = useState<string | null>(value?.endDate || null);

  useEffect(() => {
    // Reset on open/value change
    if (open) {
      const p = parseRRule(value?.recurrence || '');
      setFreq(p.freq);
      setInterval(p.interval);
      setByday(p.byday);
      setStartDate(value?.startDate || null);
      setIndefinite(Boolean(value?.indefinite));
      setEndDate(value?.endDate || null);
    }
  }, [open, value?.recurrence, value?.startDate, value?.endDate, value?.indefinite]);

  const toggleDay = (code: string) => {
    setByday((curr) => (curr.includes(code) ? curr.filter((c) => c !== code) : [...curr, code]));
  };

  const rrule = buildRRule(freq, interval, byday);

  const canSave = () => {
    if (!startDate) return false;
    if (!rrule) return false;
    if (!indefinite && endDate && startDate) {
      return new Date(endDate) >= new Date(startDate);
    }
    return true;
  };

  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog dialog-lg" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3 className="dialog-title">Recurrence</h3>
        </div>
        <div className="dialog-content">
          <div className="flex flex-col gap-5">
            {/* Frequency */}
            <div className="form-group">
              <label className="label">Frequency</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="frequency"
                    value="DAILY"
                    checked={freq === 'DAILY'}
                    onChange={() => setFreq('DAILY')}
                    className="w-5 h-5"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ color: 'var(--color-text)' }}>Daily</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="frequency"
                    value="WEEKLY"
                    checked={freq === 'WEEKLY'}
                    onChange={() => setFreq('WEEKLY')}
                    className="w-5 h-5"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ color: 'var(--color-text)' }}>Weekly</span>
                </label>
              </div>
            </div>

            {/* Interval */}
            <div className="form-group">
              <label className="label">Interval</label>
              <input
                type="number"
                className="input"
                min={1}
                value={interval}
                onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value || '1', 10)))}
                style={{ maxWidth: '120px' }}
              />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                {freq === 'DAILY' ? 'Every N day(s)' : 'Every N week(s)'}
              </p>
            </div>

            {/* Days of Week (for weekly) */}
            {freq === 'WEEKLY' && (
              <div className="form-group">
                <label className="label">Days of week</label>
                <div className="flex gap-2 flex-wrap">
                  {DayCodes.map((d) => (
                    <button
                      key={d.code}
                      type="button"
                      className={`btn ${byday.includes(d.code) ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => toggleDay(d.code)}
                      style={{ minWidth: '56px', padding: '0.5rem 0.75rem' }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                {byday.length === 0 && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    If none selected, any day in the interval week will match.
                  </p>
                )}
              </div>
            )}

            {/* Date Range */}
            <div className="form-group">
              <label className="label">Range</label>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="label" style={{ fontSize: 'var(--text-xs)' }}>Start Date</label>
                  <input
                    type="date"
                    className="input"
                    value={formatDateInput(startDate)}
                    onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value).toISOString() : null)}
                  />
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={indefinite}
                    onChange={(e) => setIndefinite(e.target.checked)}
                    className="w-5 h-5"
                    style={{ accentColor: 'var(--color-accent)' }}
                  />
                  <span style={{ color: 'var(--color-text)' }}>Recurs indefinitely</span>
                </label>

                <div style={{ opacity: indefinite ? 0.5 : 1 }}>
                  <label className="label" style={{ fontSize: 'var(--text-xs)' }}>End Date</label>
                  <input
                    type="date"
                    className="input"
                    value={formatDateInput(endDate)}
                    onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value).toISOString() : null)}
                    disabled={indefinite}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="form-group">
              <label className="label">Preview</label>
              <div 
                className="p-3 rounded-lg"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-divider)' }}
              >
                <p style={{ color: 'var(--color-text)', fontFamily: 'monospace' }}>
                  {rrule || '—'}
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                  Supported: FREQ=DAILY;INTERVAL=N or FREQ=WEEKLY;INTERVAL=N;BYDAY=MO,TU,WE,TH,FR,SA,SU
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!canSave()}
            onClick={() =>
              onSave({
                recurrence: rrule,
                startDate,
                endDate: indefinite ? null : endDate,
                indefinite,
              })
            }
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
