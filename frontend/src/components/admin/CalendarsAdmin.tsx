'use client';

import { useEffect, useState } from 'react';
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

export default function CalendarsAdmin() {
  const [items, setItems] = useState<CalendarSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Omit<CalendarSource, 'id' | 'displayOrder'>>({ 
    name: '', 
    icalUrl: '', 
    colorHex: '#60a5fa', 
    enabled: true 
  });
  // drag & drop state
  const [draggingId, setDraggingId] = useState<number | null>(null);

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

  // drag & drop helpers
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
    } catch (e: any) {
      setError(e?.message || 'Failed to delete calendar');
    }
  };

  const addItem = async () => {
    if (!newItem.name || !newItem.icalUrl) return;
    try {
      const created = await calendarsApi.create(newItem);
      setItems([...items, created]);
      setNewItem({ name: '', icalUrl: '', colorHex: '#60a5fa', enabled: true });
    } catch (e: any) {
      setError(e?.message || 'Failed to add calendar');
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
        <h2 className="section-title">Calendars</h2>
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

      {/* Calendars Table */}
      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 48 }}></th>
              <th style={{ width: '20%' }}>Name</th>
              <th>iCal URL</th>
              <th style={{ width: 80 }}>Color</th>
              <th style={{ width: 80, textAlign: 'center' }}>Enabled</th>
              <th style={{ width: 100, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr
                key={it.id}
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
                    onChange={e => setItems(arr => arr.map(a => a.id === it.id ? { ...a, name: e.target.value } : a))}
                    placeholder="Calendar name"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="input input-sm"
                    value={it.icalUrl}
                    onChange={e => setItems(arr => arr.map(a => a.id === it.id ? { ...a, icalUrl: e.target.value } : a))}
                    placeholder="https://..."
                  />
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <ColorPicker
                      value={it.colorHex}
                      onChange={(val) => setItems(arr => arr.map(a => a.id === it.id ? { ...a, colorHex: val } : a))}
                      showText={false}
                      allowCustom={false}
                      variant="popover"
                    />
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    className={`switch ${it.enabled ? 'switch-checked' : ''}`}
                    onClick={() => setItems(arr => arr.map(a => a.id === it.id ? { ...a, enabled: !a.enabled } : a))}
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
            ))}
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

      {/* Add New Calendar */}
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
        </div>
      </div>
    </div>
  );
}
