'use client';

import { Fragment, useEffect, useState } from 'react';
import { CalendarSource, calendarsApi } from '@/lib/api';
import ColorPicker from '@/components/shared/ColorPicker';

// SVG Icons as components
const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconSave = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconGripVertical = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);

const IconFilter = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

function hasActiveFilters(s: CalendarSource): boolean {
  return !!(s.titleIncludes || s.titleExcludes || s.categoryIncludes || s.categoryExcludes);
}

export default function CalendarsAdmin() {
  const [items, setItems] = useState<CalendarSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Omit<CalendarSource, 'id' | 'displayOrder'>>({
    name: '',
    icalUrl: '',
    colorHex: '#60a5fa',
    enabled: true,
    titleIncludes: '',
    titleExcludes: '',
    categoryIncludes: '',
    categoryExcludes: '',
  });
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const calendars = await calendarsApi.getAll();
      setItems(calendars);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load calendars');
    } finally {
      setLoading(false);
    }
  };

  const onDragStart = (id: number) => () => setDraggingId(id);
  const onDragOverItem = (overId: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingId === null || draggingId === overId) return;
    const fromIdx = items.findIndex((u) => u.id === draggingId);
    const toIdx = items.findIndex((u) => u.id === overId);
    if (fromIdx === -1 || toIdx === -1) return;
    const newOrder = [...items];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    setItems(newOrder);
  };
  const onDropList = async () => {
    if (draggingId === null) return;
    setDraggingId(null);
    try {
      await calendarsApi.updateOrder(items.map((u) => u.id));
    } catch (e: any) {
      setError(e?.message || 'Failed to update order');
    }
  };

  const saveItem = async (item: CalendarSource) => {
    try {
      await calendarsApi.update(item.id, item);
      setItems(await calendarsApi.getAll());
    } catch (e: any) {
      setError(e?.message || 'Failed to save calendar');
    }
  };

  const removeItem = async (id: number) => {
    if (!confirm('Delete this calendar?')) return;
    try {
      await calendarsApi.delete(id);
      setItems(items.filter(i => i.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to delete calendar');
    }
  };

  const addItem = async () => {
    if (!newItem.name || !newItem.icalUrl) return;
    try {
      const created = await calendarsApi.create(newItem);
      setItems([...items, created]);
      setNewItem({
        name: '',
        icalUrl: '',
        colorHex: '#60a5fa',
        enabled: true,
        titleIncludes: '',
        titleExcludes: '',
        categoryIncludes: '',
        categoryExcludes: '',
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to add calendar');
    }
  };

  const updateField = (id: number, patch: Partial<CalendarSource>) => {
    setItems(arr => arr.map(a => a.id === id ? { ...a, ...patch } : a));
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
      <div className="section-header">
        <h2 className="section-title">Calendars</h2>
      </div>

      {error && (
        <div
          className="mb-4 p-3 rounded-lg"
          style={{ background: 'var(--color-error-muted)', color: 'var(--color-error)' }}
        >
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 48 }}></th>
              <th style={{ width: '20%' }}>Name</th>
              <th>iCal URL</th>
              <th style={{ width: 80 }}>Color</th>
              <th style={{ width: 80, textAlign: 'center' }}>Enabled</th>
              <th style={{ width: 140, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const isExpanded = expandedId === it.id;
              const filtersActive = hasActiveFilters(it);
              return (
                <Fragment key={it.id}>
                  <tr
                    draggable
                    onDragStart={onDragStart(it.id)}
                    onDragOver={onDragOverItem(it.id)}
                    onDrop={onDropList}
                    style={{ opacity: draggingId === it.id ? 0.5 : 1 }}
                  >
                    <td>
                      <span className="drag-handle">
                        <IconGripVertical />
                      </span>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="input input-sm"
                        value={it.name}
                        onChange={e => updateField(it.id, { name: e.target.value })}
                        placeholder="Calendar name"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="input input-sm"
                        value={it.icalUrl}
                        onChange={e => updateField(it.id, { icalUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <ColorPicker
                          value={it.colorHex}
                          onChange={(val) => updateField(it.id, { colorHex: val })}
                          showText={false}
                          allowCustom={false}
                          variant="popover"
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={`switch ${it.enabled ? 'switch-checked' : ''}`}
                        onClick={() => updateField(it.id, { enabled: !it.enabled })}
                        role="switch"
                        aria-checked={it.enabled}
                      >
                        <span className="switch-thumb" />
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="icon-btn icon-btn-sm"
                          onClick={() => setExpandedId(isExpanded ? null : it.id)}
                          aria-label={isExpanded ? 'Hide filters' : 'Show filters'}
                          title={filtersActive ? 'Filters active' : 'Configure filters'}
                          style={{ color: filtersActive ? 'var(--color-primary)' : undefined }}
                        >
                          <IconFilter />
                        </button>
                        <button
                          className="icon-btn icon-btn-sm"
                          onClick={() => saveItem(it)}
                          aria-label="Save"
                          title="Save changes"
                        >
                          <IconSave />
                        </button>
                        <button
                          className="icon-btn icon-btn-sm icon-btn-danger"
                          onClick={() => removeItem(it.id)}
                          aria-label="Delete"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} style={{ background: 'var(--color-bg-subtle)' }}>
                        <div className="p-4 grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                          <FilterField
                            label="Title includes"
                            hint="Comma-separated. Event kept only if title contains any. Empty = no filter."
                            value={it.titleIncludes ?? ''}
                            onChange={v => updateField(it.id, { titleIncludes: v })}
                          />
                          <FilterField
                            label="Title excludes"
                            hint="Comma-separated. Event dropped if title contains any."
                            value={it.titleExcludes ?? ''}
                            onChange={v => updateField(it.id, { titleExcludes: v })}
                          />
                          <FilterField
                            label="Category includes"
                            hint="Comma-separated. Matches ICS CATEGORIES exactly (case-insensitive)."
                            value={it.categoryIncludes ?? ''}
                            onChange={v => updateField(it.id, { categoryIncludes: v })}
                          />
                          <FilterField
                            label="Category excludes"
                            hint="Comma-separated. Event dropped if any category matches."
                            value={it.categoryExcludes ?? ''}
                            onChange={v => updateField(it.id, { categoryExcludes: v })}
                          />
                          <div style={{ gridColumn: '1 / -1' }} className="flex justify-end">
                            <button className="btn btn-primary btn-sm" onClick={() => saveItem(it)}>
                              <IconSave />
                              <span>Save filters</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📅</div>
                    <p>No calendars yet</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h3
          className="text-lg font-medium mb-3"
          style={{ color: 'var(--color-text)' }}
        >
          Add Calendar
        </h3>
        <div className="card p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 2fr auto auto auto' }}>
            <input
              type="text"
              className="input"
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="Calendar name"
            />
            <input
              type="text"
              className="input"
              value={newItem.icalUrl}
              onChange={e => setNewItem({ ...newItem, icalUrl: e.target.value })}
              placeholder="iCal URL (https://...)"
            />
            <div className="flex items-center gap-2">
              <ColorPicker
                value={newItem.colorHex}
                onChange={(val) => setNewItem({ ...newItem, colorHex: val })}
                showText={false}
                allowCustom={false}
                variant="popover"
              />
            </div>
            <button
              className={`switch ${newItem.enabled ? 'switch-checked' : ''}`}
              onClick={() => setNewItem({ ...newItem, enabled: !newItem.enabled })}
              role="switch"
              aria-checked={newItem.enabled}
              style={{ alignSelf: 'center' }}
            >
              <span className="switch-thumb" />
            </button>
            <button
              className="btn btn-primary"
              onClick={addItem}
              disabled={!newItem.name || !newItem.icalUrl}
            >
              <IconPlus />
              <span>Add</span>
            </button>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
            Tip: after creating, click the filter icon on a row to configure title/category filters that apply to every client.
          </p>
        </div>
      </div>
    </div>
  );
}

function FilterField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</span>
      <input
        type="text"
        className="input input-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. Birthdays, Holidays"
      />
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{hint}</span>
    </label>
  );
}
