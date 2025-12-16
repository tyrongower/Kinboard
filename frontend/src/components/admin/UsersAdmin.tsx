'use client';

import { useEffect, useMemo, useState } from 'react';
import { userApi, User } from '@/lib/api';
import ColorPicker from '@/components/shared/ColorPicker';

// SVG Icons as components
const IconUserPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
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

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Omit<User, 'id'>>({ username: '', displayName: '', colorHex: '#777777' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  // drag & drop state
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setUsers(await userApi.getAll());
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ username: '', displayName: '', colorHex: '#777777' });
    setAvatarFile(null);
    setOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ username: u.username, displayName: u.displayName, colorHex: u.colorHex });
    setAvatarFile(null);
    setOpen(true);
  };

  const closeDialog = () => setOpen(false);

  const validColor = useMemo(() => /^#([0-9a-fA-F]{6})$/.test(form.colorHex), [form.colorHex]);
  const canSave = form.username.trim() && form.displayName.trim() && validColor;

  const save = async () => {
    try {
      if (editing) {
        await userApi.update(editing.id, { ...editing, ...form });
        if (avatarFile) {
          if (avatarFile.size > 5 * 1024 * 1024) throw new Error('Avatar too large (max 5 MB)');
          const url = await userApi.uploadAvatar(editing.id, avatarFile);
          setUsers((prev) => prev.map((x) => (x.id === editing.id ? { ...x, avatarUrl: url } : x)));
        }
      } else {
        const created = await userApi.create(form);
        if (avatarFile) {
          try {
            const url = await userApi.uploadAvatar(created.id, avatarFile);
            created.avatarUrl = url;
          } catch {}
        }
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to save user');
    }
  };

  // drag & drop helpers
  const onDragStart = (id: number) => () => setDraggingId(id);
  const onDragOverRow = (overId: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingId === null || draggingId === overId) return;
    const fromIdx = users.findIndex((u) => u.id === draggingId);
    const toIdx = users.findIndex((u) => u.id === overId);
    if (fromIdx === -1 || toIdx === -1) return;
    const newOrder = [...users];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    setUsers(newOrder);
  };
  const onDropRow = async () => {
    if (draggingId === null) return;
    setDraggingId(null);
    try {
      await userApi.updateOrder(users.map((u) => u.id));
    } catch (e: any) {
      setError(e?.message || 'Failed to update order');
    }
  };

  const remove = async (u: User) => {
    if (!confirm(`Delete user ${u.displayName}?`)) return;
    try {
      await userApi.delete(u.id);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete user');
    }
  };

  return (
    <div>
      {/* Section Header */}
      <div className="section-header">
        <h2 className="section-title">Users</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          <IconUserPlus />
          <span>New User</span>
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

      {/* Users Table */}
      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 48 }}></th>
              <th>Display Name</th>
              <th>Username</th>
              <th>Color</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                draggable
                onDragStart={onDragStart(u.id)}
                onDragOver={onDragOverRow(u.id)}
                onDrop={onDropRow}
                style={{ opacity: draggingId === u.id ? 0.5 : 1 }}
              >
                <td>
                  <span className="drag-handle">
                    <IconGripVertical />
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    {u.avatarUrl ? (
                      <img 
                        src={u.avatarUrl} 
                        alt={u.displayName} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div 
                        className="avatar avatar-sm"
                        style={{ background: u.colorHex, color: 'white' }}
                      >
                        {u.displayName.charAt(0)}
                      </div>
                    )}
                    <span style={{ color: 'var(--color-text)' }}>{u.displayName}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{u.username}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div 
                      className="color-swatch"
                      style={{ background: u.colorHex }}
                    />
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                      {u.colorHex}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button 
                      className="icon-btn icon-btn-sm" 
                      onClick={() => openEdit(u)}
                      aria-label="Edit"
                    >
                      <IconEdit />
                    </button>
                    <button 
                      className="icon-btn icon-btn-sm icon-btn-danger" 
                      onClick={() => remove(u)}
                      aria-label="Delete"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <p>No users yet</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog */}
      {open && (
        <div className="dialog-overlay" onClick={closeDialog}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3 className="dialog-title">{editing ? 'Edit User' : 'New User'}</h3>
            </div>
            <div className="dialog-content">
              <div className="flex flex-col gap-4">
                {/* Display Name */}
                <div className="form-group">
                  <label className="label">Display Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={form.displayName}
                    onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                    placeholder="Enter display name"
                  />
                </div>

                {/* Username */}
                <div className="form-group">
                  <label className="label">Username *</label>
                  <input
                    type="text"
                    className="input"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                    placeholder="Enter username"
                  />
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    Unique key used for linking
                  </p>
                </div>

                {/* Color */}
                <div className="form-group">
                  <label className="label">Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      className={`input flex-1 ${!validColor ? 'border-red-500' : ''}`}
                      value={form.colorHex}
                      onChange={(e) => setForm((f) => ({ ...f, colorHex: e.target.value }))}
                      placeholder="#RRGGBB"
                      style={!validColor ? { borderColor: 'var(--color-error)' } : {}}
                    />
                    <ColorPicker
                      value={form.colorHex}
                      onChange={(val) => setForm((f) => ({ ...f, colorHex: val }))}
                      showText={false}
                      allowCustom={false}
                      variant="popover"
                    />
                  </div>
                  {!validColor && (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>
                      Enter hex color like #AABBCC
                    </p>
                  )}
                </div>

                {/* Avatar (only when editing) */}
                {editing && (
                  <div className="form-group">
                    <label className="label">Avatar</label>
                    {editing.avatarUrl && (
                      <div className="flex items-center gap-4 mb-3">
                        <img 
                          src={editing.avatarUrl} 
                          alt="avatar" 
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <button
                          className="btn btn-secondary text-sm"
                          style={{ 
                            minHeight: '36px',
                            color: 'var(--color-error)',
                            borderColor: 'var(--color-error)'
                          }}
                          onClick={async () => {
                            try {
                              await userApi.deleteAvatar(editing.id);
                              setUsers((prev) => prev.map((x) => (x.id === editing.id ? { ...x, avatarUrl: null } : x)));
                              setEditing({ ...editing, avatarUrl: null });
                            } catch (e: any) {
                              setError(e?.message || 'Failed to delete avatar');
                            }
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      className="input"
                      style={{ padding: '0.5rem' }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={closeDialog}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={save}
                disabled={!canSave}
                style={!canSave ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
