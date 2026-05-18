'use client';

import { useEffect, useMemo, useState } from 'react';
import { shoppingListApi, ShoppingList } from '@/lib/api';
import ColorPicker from '@/components/shared/ColorPicker';

// SVG Icons as components
const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconEdit = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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

const IconChevronUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function ShoppingAdmin() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ShoppingList | null>(null);
  const [form, setForm] = useState<{ name: string; colorHex: string }>({ name: '', colorHex: '#3B82F6' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  // drag & drop state
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setLists(await shoppingListApi.getAll());
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load shopping lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', colorHex: '#3B82F6' });
    setAvatarFile(null);
    setOpen(true);
  };

  const openEdit = (list: ShoppingList) => {
    setEditing(list);
    setForm({ name: list.name, colorHex: list.colorHex });
    setAvatarFile(null);
    setOpen(true);
  };

  const closeDialog = () => setOpen(false);

  const validColor = useMemo(() => /^#([0-9a-fA-F]{6})$/.test(form.colorHex), [form.colorHex]);
  const canSave = form.name.trim() && validColor;

  const save = async () => {
    try {
      if (editing) {
        await shoppingListApi.update(editing.id, { ...editing, ...form });
        if (avatarFile) {
          if (avatarFile.size > 5 * 1024 * 1024) throw new Error('Avatar too large (max 5 MB)');
          const url = await shoppingListApi.uploadAvatar(editing.id, avatarFile);
          setLists((prev) => prev.map((x) => (x.id === editing.id ? { ...x, avatarUrl: url } : x)));
        }
      } else {
        const created = await shoppingListApi.create({ ...form, displayOrder: lists.length });
        if (avatarFile) {
          try {
            const url = await shoppingListApi.uploadAvatar(created.id, avatarFile);
            created.avatarUrl = url;
          } catch {}
        }
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to save shopping list');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this shopping list and all its items?')) return;
    try {
      await shoppingListApi.delete(id);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete shopping list');
    }
  };

  const handleDeleteAvatar = async (list: ShoppingList) => {
    if (!confirm('Remove avatar from this list?')) return;
    try {
      await shoppingListApi.deleteAvatar(list.id);
      setLists((prev) => prev.map((x) => (x.id === list.id ? { ...x, avatarUrl: null } : x)));
    } catch (e: any) {
      setError(e?.message || 'Failed to delete avatar');
    }
  };

  // Drag & drop handlers
  const handleDragStart = (id: number) => setDraggingId(id);
  const handleDragEnd = () => setDraggingId(null);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (targetId: number) => {
    if (draggingId === null || draggingId === targetId) return;
    const oldIndex = lists.findIndex((l) => l.id === draggingId);
    const newIndex = lists.findIndex((l) => l.id === targetId);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = [...lists];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setLists(reordered);
    setDraggingId(null);
    try {
      await shoppingListApi.updateOrder(reordered.map((l) => l.id));
    } catch (e: any) {
      setError(e?.message || 'Failed to update order');
      await load();
    }
  };

  const moveList = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= lists.length) return;
    const reordered = [...lists];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setLists(reordered);
    try {
      await shoppingListApi.updateOrder(reordered.map((l) => l.id));
    } catch (e: any) {
      setError(e?.message || 'Failed to update order');
      await load();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
          <span style={{ color: 'var(--color-text-secondary)' }}>Loading shopping lists...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: 0 }}>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Shopping Lists
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Manage shopping lists for the kiosk
          </p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={openCreate}>
          <IconPlus />
          <span>Add List</span>
        </button>
      </div>

      {error && (
        <div
          className="p-4 rounded-xl"
          style={{ background: 'var(--color-error-muted)', color: 'var(--color-error)' }}
        >
          {error}
          <button className="ml-4 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Lists Table */}
      {lists.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <p style={{ color: 'var(--color-text-secondary)' }}>No shopping lists yet</p>
          <button className="btn btn-primary mt-4" onClick={openCreate}>
            Create your first list
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="admin-table-desktop card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'var(--color-surface)' }}>
                  <th className="w-24"></th>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text)' }}>
                    List
                  </th>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text)' }}>
                    Items
                  </th>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text)' }}>
                    Color
                  </th>
                  <th className="w-32"></th>
                </tr>
              </thead>
              <tbody>
                {lists.map((list, idx) => {
                  const importantCount = list.items?.filter((i) => i.isImportant && !i.isBought).length || 0;
                  const unboughtCount = list.items?.filter((i) => !i.isBought).length || 0;
                  return (
                    <tr
                      key={list.id}
                      draggable
                      onDragStart={() => handleDragStart(list.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(list.id)}
                      className="border-t transition-colors"
                      style={{
                        borderColor: 'var(--color-divider)',
                        background: draggingId === list.id ? 'var(--color-surface)' : undefined,
                      }}
                    >
                      <td className="p-2" style={{ color: 'var(--color-text-muted)' }}>
                        <div className="flex items-center gap-1">
                          <span className="drag-handle"><IconGripVertical /></span>
                          <div className="reorder-btns">
                            <button className="icon-btn" onClick={() => moveList(idx, -1)} disabled={idx === 0} aria-label="Move up">
                              <IconChevronUp />
                            </button>
                            <button className="icon-btn" onClick={() => moveList(idx, 1)} disabled={idx === lists.length - 1} aria-label="Move down">
                              <IconChevronDown />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {list.avatarUrl ? (
                            <div className="relative group">
                              <img
                                src={list.avatarUrl}
                                alt={list.name}
                                className="avatar avatar-md object-cover"
                                style={{ border: `2px solid ${list.colorHex}` }}
                                loading="lazy"
                              />
                              <button
                                onClick={() => handleDeleteAvatar(list)}
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ background: 'var(--color-error)', color: 'white', minHeight: 0 }}
                                title="Remove avatar"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div
                              className="avatar avatar-md"
                              style={{ background: list.colorHex, color: 'white' }}
                            >
                              {list.name[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                              {list.name}
                            </span>
                            {importantCount > 0 && (
                              <span
                                className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ background: 'var(--color-warning-muted)', color: 'var(--color-warning)' }}
                              >
                                {importantCount} important
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>
                        {unboughtCount} item{unboughtCount !== 1 ? 's' : ''}
                      </td>
                      <td className="p-4">
                        <div
                          className="w-8 h-8 rounded-lg"
                          style={{ background: list.colorHex }}
                          title={list.colorHex}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openEdit(list)}
                            className="icon-btn icon-btn-sm"
                            aria-label="Edit"
                            title="Edit"
                          >
                            <IconEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(list.id)}
                            className="icon-btn icon-btn-sm icon-btn-danger"
                            aria-label="Delete"
                            title="Delete"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="admin-cards-mobile">
            {lists.map((list, idx) => {
              const importantCount = list.items?.filter((i) => i.isImportant && !i.isBought).length || 0;
              const unboughtCount = list.items?.filter((i) => !i.isBought).length || 0;
              return (
                <div key={list.id} className="admin-card-row">
                  <div className="admin-card-row-header">
                    {list.avatarUrl ? (
                      <img
                        src={list.avatarUrl}
                        alt={list.name}
                        className="avatar avatar-md object-cover shrink-0"
                        style={{ border: `2px solid ${list.colorHex}` }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="avatar avatar-md shrink-0" style={{ background: list.colorHex, color: 'white' }}>
                        {list.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate" style={{ color: 'var(--color-text)' }}>
                        {list.name}
                      </div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                        {unboughtCount} item{unboughtCount !== 1 ? 's' : ''}
                        {importantCount > 0 && ` · ${importantCount} important`}
                      </div>
                    </div>
                    <div className="reorder-btns shrink-0">
                      <button className="icon-btn" onClick={() => moveList(idx, -1)} disabled={idx === 0} aria-label="Move up">
                        <IconChevronUp />
                      </button>
                      <button className="icon-btn" onClick={() => moveList(idx, 1)} disabled={idx === lists.length - 1} aria-label="Move down">
                        <IconChevronDown />
                      </button>
                    </div>
                  </div>

                  <div className="admin-card-row-actions">
                    <button className="btn btn-secondary flex-1" onClick={() => openEdit(list)}>
                      <IconEdit />
                      Edit
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                      onClick={() => handleDelete(list.id)}
                      aria-label={`Delete ${list.name}`}
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Create/Edit Dialog */}
      {open && (
        <div className="dialog-overlay" onClick={closeDialog}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3 className="dialog-title">
                {editing ? 'Edit Shopping List' : 'New Shopping List'}
              </h3>
            </div>
            <div className="dialog-content">
              <div className="flex flex-col gap-4">
                {/* Name */}
                <div className="form-group">
                  <label className="label">Name</label>
                  <input
                    type="text"
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Groceries"
                    autoFocus
                  />
                </div>

                {/* Color */}
                <div className="form-group">
                  <label className="label">Color</label>
                  <ColorPicker
                    value={form.colorHex}
                    onChange={(val) => setForm({ ...form, colorHex: val })}
                    variant="popover"
                    showText={false}
                    allowCustom={false}
                  />
                </div>

                {/* Avatar */}
                <div className="form-group">
                  <label className="label">Avatar (optional)</label>
                  <div className="flex items-center gap-4 flex-wrap">
                    {(editing?.avatarUrl || avatarFile) && (
                      <img
                        src={avatarFile ? URL.createObjectURL(avatarFile) : editing?.avatarUrl || ''}
                        alt="Preview"
                        className="avatar avatar-lg object-cover"
                        style={{ border: `2px solid ${form.colorHex}` }}
                      />
                    )}
                    <div className="file-input-wrapper flex-1">
                      <label className="file-input-label">
                        {avatarFile ? 'Change Avatar' : (editing?.avatarUrl ? 'Replace Avatar' : 'Choose Avatar')}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      {avatarFile && <span className="file-input-name">{avatarFile.name}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={closeDialog}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={!canSave}>
                {editing ? 'Save Changes' : 'Create List'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
