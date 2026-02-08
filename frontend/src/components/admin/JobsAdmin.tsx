'use client';

import { useEffect, useState } from 'react';
import { jobApi, jobAssignmentApi, Job, JobAssignment, userApi, User } from '@/lib/api';
import { formatDateForApi } from '@/lib/dateUtils';
import RecurrenceModal from './RecurrenceModal';

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

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

function formatDateInput(d?: string) {
  if (!d) return '';
  // Parse the ISO date string and format as YYYY-MM-DD in local timezone
  return formatDateForApi(new Date(d));
}

export default function JobsAdmin() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState<Partial<Job>>({ title: '', description: '', recurrence: '', recurrenceStartDate: null, recurrenceEndDate: null, recurrenceIndefinite: false, useSharedRecurrence: true, assignments: [] });
  const [recurrenceUiOpen, setRecurrenceUiOpen] = useState(false);
  
  // Assignment management state
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<JobAssignment | null>(null);
  const [assignmentForm, setAssignmentForm] = useState<Partial<JobAssignment>>({ userId: 0, recurrence: '', recurrenceStartDate: null, recurrenceEndDate: null, recurrenceIndefinite: false });
  const [assignmentRecurrenceOpen, setAssignmentRecurrenceOpen] = useState(false);
  
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [allJobs, allUsers] = await Promise.all([jobApi.getAll(), userApi.getAll()]);
      setJobs(allJobs);
      setUsers(allUsers);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    const today = formatDateForApi(new Date());
    setForm({ title: '', description: '', recurrence: '', recurrenceStartDate: today, recurrenceEndDate: null, recurrenceIndefinite: true, useSharedRecurrence: true, assignments: [] });
    setImageFile(null);
    setOpen(true);
  };
  const openEdit = (c: Job) => {
    setEditing(c);
    setForm({
      id: c.id,
      title: c.title,
      description: c.description,
      createdAt: c.createdAt,
      recurrence: c.recurrence,
      recurrenceStartDate: c.recurrenceStartDate ?? null,
      recurrenceEndDate: c.recurrenceIndefinite ? null : (c.recurrenceEndDate ?? null),
      recurrenceIndefinite: c.recurrenceIndefinite ?? false,
      useSharedRecurrence: c.useSharedRecurrence ?? true,
      assignments: c.assignments ?? [],
    });
    setImageFile(null);
    setOpen(true);
  };
  const closeDialog = () => setOpen(false);
  const openRecurrence = () => setRecurrenceUiOpen(true);
  const closeRecurrence = () => setRecurrenceUiOpen(false);

  const canSave = (form.title ?? '').toString().trim().length > 0;

  const save = async () => {
    try {
      let jobId: number;
      if (editing) {
        // For update, send full job shape
        const updated: Job = {
          id: editing.id,
          title: (form.title as string) ?? editing.title,
          description: (form.description as string) || undefined,
          createdAt: form.createdAt || editing.createdAt,
          recurrence: (form.recurrence as string) || undefined,
          recurrenceStartDate: form.recurrenceStartDate ? new Date(form.recurrenceStartDate as string).toISOString() : null,
          recurrenceEndDate: form.recurrenceIndefinite ? null : (form.recurrenceEndDate ? new Date(form.recurrenceEndDate as string).toISOString() : null),
          recurrenceIndefinite: Boolean(form.recurrenceIndefinite),
          useSharedRecurrence: Boolean(form.useSharedRecurrence),
        };
        await jobApi.update(editing.id, updated);
        jobId = editing.id;
        
        // Upload image if selected
        if (imageFile) {
          if (imageFile.size > 5 * 1024 * 1024) throw new Error('Image too large (max 5 MB)');
          const url = await jobApi.uploadImage(jobId, imageFile);
          setJobs((prev) => prev.map((x) => (x.id === jobId ? { ...x, imageUrl: url } : x)));
        }
      } else {
        // create accepts Omit<Job, 'id' | 'createdAt'>
        const newJob = await jobApi.create({
          title: (form.title as string) ?? '',
          description: (form.description as string) || undefined,
          recurrence: (form.recurrence as string) || undefined,
          recurrenceStartDate: form.recurrenceStartDate ? new Date(form.recurrenceStartDate as string).toISOString() : null,
          recurrenceEndDate: form.recurrenceIndefinite ? null : (form.recurrenceEndDate ? new Date(form.recurrenceEndDate as string).toISOString() : null),
          recurrenceIndefinite: Boolean(form.recurrenceIndefinite),
          useSharedRecurrence: Boolean(form.useSharedRecurrence),
        });
        jobId = newJob.id;
        
        // Upload image if selected
        if (imageFile && jobId) {
          try {
            if (imageFile.size > 5 * 1024 * 1024) throw new Error('Image too large (max 5 MB)');
            await jobApi.uploadImage(jobId, imageFile);
          } catch {}
        }
        
        // Create assignments for the new job
        if (form.assignments && form.assignments.length > 0 && newJob.id) {
          for (const assignment of form.assignments) {
            await jobAssignmentApi.create(newJob.id, {
              userId: assignment.userId,
              recurrence: assignment.recurrence || undefined,
              recurrenceStartDate: assignment.recurrenceStartDate || null,
              recurrenceEndDate: assignment.recurrenceIndefinite ? null : (assignment.recurrenceEndDate || null),
              recurrenceIndefinite: Boolean(assignment.recurrenceIndefinite),
              displayOrder: assignment.displayOrder,
            });
          }
        }
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to save job');
    }
  };

  const remove = async (c: Job) => {
    if (!confirm(`Delete job "${c.title}"?`)) return;
    try {
      await jobApi.delete(c.id);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete job');
    }
  };

  // Assignment management functions
  const openAddAssignment = () => {
    setEditingAssignment(null);
    setAssignmentForm({ userId: 0, recurrence: '', recurrenceStartDate: null, recurrenceEndDate: null, recurrenceIndefinite: false, displayOrder: 0 });
    setAssignmentDialogOpen(true);
  };

  const openEditAssignment = (assignment: JobAssignment) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      id: assignment.id,
      jobId: assignment.jobId,
      userId: assignment.userId,
      recurrence: assignment.recurrence || '',
      recurrenceStartDate: assignment.recurrenceStartDate || null,
      recurrenceEndDate: assignment.recurrenceIndefinite ? null : (assignment.recurrenceEndDate || null),
      recurrenceIndefinite: assignment.recurrenceIndefinite || false,
      displayOrder: assignment.displayOrder,
    });
    setAssignmentDialogOpen(true);
  };

  const closeAssignmentDialog = () => {
    setAssignmentDialogOpen(false);
    setEditingAssignment(null);
  };

  const saveAssignment = async () => {
    if (!assignmentForm.userId) return;
    
    try {
      // Find the user to include in the local assignment
      const selectedUser = users.find(u => u.id === assignmentForm.userId);
      
      if (editing) {
        // Job already exists - save to database
        if (editingAssignment) {
          // Update existing assignment
          await jobAssignmentApi.update(editing.id, editingAssignment.id, {
            id: editingAssignment.id,
            jobId: editing.id,
            userId: assignmentForm.userId,
            recurrence: assignmentForm.recurrence || undefined,
            recurrenceStartDate: assignmentForm.recurrenceStartDate ? new Date(assignmentForm.recurrenceStartDate as string).toISOString() : null,
            recurrenceEndDate: assignmentForm.recurrenceIndefinite ? null : (assignmentForm.recurrenceEndDate ? new Date(assignmentForm.recurrenceEndDate as string).toISOString() : null),
            recurrenceIndefinite: Boolean(assignmentForm.recurrenceIndefinite),
            displayOrder: assignmentForm.displayOrder || 0,
          });
        } else {
          // Create new assignment
          await jobAssignmentApi.create(editing.id, {
            userId: assignmentForm.userId,
            recurrence: assignmentForm.recurrence || undefined,
            recurrenceStartDate: assignmentForm.recurrenceStartDate ? new Date(assignmentForm.recurrenceStartDate as string).toISOString() : null,
            recurrenceEndDate: assignmentForm.recurrenceIndefinite ? null : (assignmentForm.recurrenceEndDate ? new Date(assignmentForm.recurrenceEndDate as string).toISOString() : null),
            recurrenceIndefinite: Boolean(assignmentForm.recurrenceIndefinite),
            displayOrder: (form.assignments?.length || 0),
          });
        }
        
        // Reload jobs to get updated assignments
        await load();
        // Update the form with the new assignments
        const updatedJob = (await jobApi.getAll()).find(c => c.id === editing.id);
        if (updatedJob) {
          setForm(f => ({ ...f, assignments: updatedJob.assignments || [] }));
        }
      } else {
        // New job - add assignment to local state (will be saved after job is created)
        if (editingAssignment) {
          // Update existing local assignment
          setForm(f => ({
            ...f,
            assignments: (f.assignments || []).map(a => 
              a.id === editingAssignment.id ? {
                ...a,
                userId: assignmentForm.userId || a.userId,
                user: selectedUser || a.user || null,
                recurrence: assignmentForm.recurrence || undefined,
                recurrenceStartDate: assignmentForm.recurrenceStartDate || null,
                recurrenceEndDate: assignmentForm.recurrenceIndefinite ? null : (assignmentForm.recurrenceEndDate || null),
                recurrenceIndefinite: Boolean(assignmentForm.recurrenceIndefinite),
              } : a
            )
          }));
        } else {
          // Add new local assignment with temporary negative ID
          const tempId = -(Date.now());
          const newAssignment: JobAssignment = {
            id: tempId,
            jobId: 0, // Will be set when job is created
            userId: assignmentForm.userId,
            user: selectedUser || null,
            recurrence: assignmentForm.recurrence || undefined,
            recurrenceStartDate: assignmentForm.recurrenceStartDate || null,
            recurrenceEndDate: assignmentForm.recurrenceIndefinite ? null : (assignmentForm.recurrenceEndDate || null),
            recurrenceIndefinite: Boolean(assignmentForm.recurrenceIndefinite),
            displayOrder: (form.assignments?.length || 0),
          };
          setForm(f => ({
            ...f,
            assignments: [...(f.assignments || []), newAssignment]
          }));
        }
      }
      closeAssignmentDialog();
    } catch (e: any) {
      setError(e?.message || 'Failed to save assignment');
    }
  };

  const removeAssignment = async (assignment: JobAssignment) => {
    if (!confirm(`Remove ${assignment.user?.displayName || 'this user'} from this job?`)) return;
    
    try {
      if (editing) {
        // Job exists - delete from database
        await jobAssignmentApi.delete(editing.id, assignment.id);
        await load();
      }
      // Update local state (works for both new and existing jobs)
      setForm(f => ({
        ...f,
        assignments: (f.assignments || []).filter(a => a.id !== assignment.id)
      }));
    } catch (e: any) {
      setError(e?.message || 'Failed to remove assignment');
    }
  };

  // Get users not already assigned
  const availableUsers = users.filter(u => 
    !form.assignments?.some(a => a.userId === u.id) || 
    (editingAssignment && editingAssignment.userId === u.id)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
            Jobs
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Manage jobs, images, recurrences, and assignments.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <IconPlus />
          New Job
        </button>
      </div>

      {error && (
        <div
          className="p-3 rounded-lg"
          style={{ background: 'var(--color-error-muted)', border: '1px solid var(--color-error)' }}
        >
          <p style={{ color: 'var(--color-error)', fontWeight: 600 }}>Error</p>
          <p style={{ color: 'var(--color-text)' }}>{error}</p>
        </div>
      )}

      <div className="overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Assigned To</th>
              <th>Recurrence</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="flex flex-col gap-1">
                    <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{c.title}</span>
                    {c.description && (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                        {c.description}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  {(c.assignments?.length || 0) > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      {c.assignments?.slice(0, 5).map((a) => (
                        <span
                          key={a.id}
                          className="avatar avatar-sm"
                          title={a.user?.displayName || ''}
                          style={{ background: a.user?.colorHex || '#777', color: 'white' }}
                        >
                          {a.user?.displayName?.charAt(0) || '?'}
                        </span>
                      ))}
                      {(c.assignments?.length || 0) > 5 && (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                          +{(c.assignments?.length || 0) - 5}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Unassigned</span>
                  )}
                </td>
                <td>
                  <span style={{ color: 'var(--color-text)' }}>{c.recurrence || '—'}</span>
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button className="icon-btn icon-btn-sm" onClick={() => openEdit(c)} aria-label="Edit">
                      <IconEdit />
                    </button>
                    <button
                      className="icon-btn icon-btn-sm icon-btn-danger"
                      onClick={() => remove(c)}
                      aria-label="Delete"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && jobs.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <div className="empty-state-icon">✓</div>
                    <p>No jobs yet</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Job Dialog */}
      {open && (
        <div className="dialog-overlay" onClick={closeDialog}>
          <div className="dialog dialog-lg" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3 className="dialog-title">{editing ? 'Edit Job' : 'New Job'}</h3>
            </div>
            <div className="dialog-content">
              <div className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="label">Title *</label>
                  <input
                    type="text"
                    className="input"
                    value={(form.title as string) || ''}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Enter job title"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Description</label>
                  <textarea
                    className="input"
                    value={(form.description as string) || ''}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Optional description"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Image */}
                <div className="form-group">
                  <label className="label">Image</label>
                  {editing?.imageUrl && (
                    <div className="flex items-center gap-3">
                      <img
                        src={editing.imageUrl}
                        alt="job"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <button
                        className="btn btn-secondary text-sm"
                        style={{ minHeight: '36px', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                        onClick={async () => {
                          try {
                            await jobApi.deleteImage(editing.id);
                            setJobs((prev) => prev.map((x) => (x.id === editing.id ? { ...x, imageUrl: null } : x)));
                            setEditing({ ...editing, imageUrl: null });
                          } catch (e: any) {
                            setError(e?.message || 'Failed to delete image');
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
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    Max 5 MB. PNG/JPG/WebP.
                  </p>
                </div>

                {/* Recurrence */}
                <div className="form-group">
                  <div className="flex items-center justify-between gap-3">
                    <label className="label" style={{ marginBottom: 0 }}>
                      Recurrence
                    </label>
                    <button className="btn btn-secondary text-sm" style={{ minHeight: '36px' }} onClick={openRecurrence}>
                      Edit Recurrence
                    </button>
                  </div>
                  <div
                    className="p-3 rounded-lg"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-divider)' }}
                  >
                    <p style={{ color: 'var(--color-text)', fontFamily: 'monospace' }}>
                      {form.recurrence ? (form.recurrence as string) : 'No recurrence'}
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      Start: {formatDateInput(form.recurrenceStartDate as string) || 'Not set'}{' '}
                      {form.recurrenceIndefinite
                        ? '(indefinite)'
                        : form.recurrenceEndDate
                          ? `→ End: ${formatDateInput(form.recurrenceEndDate as string)}`
                          : ''}
                    </p>
                  </div>
                </div>

                {/* Assignments */}
                <div className="form-group">
                  <div className="flex items-center justify-between gap-3">
                    <label className="label" style={{ marginBottom: 0 }}>
                      <span className="inline-flex items-center gap-2">
                        <IconUsers />
                        Assigned Users
                      </span>
                    </label>
                    <button
                      className="btn btn-secondary text-sm"
                      style={{ minHeight: '36px' }}
                      onClick={openAddAssignment}
                      disabled={availableUsers.length === 0}
                    >
                      <IconPlus />
                      Add User
                    </button>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(form.useSharedRecurrence)}
                      onChange={(e) => setForm((f) => ({ ...f, useSharedRecurrence: e.target.checked }))}
                      className="w-5 h-5"
                      style={{ accentColor: 'var(--color-accent)' }}
                    />
                    <span style={{ color: 'var(--color-text)' }}>
                      Use shared recurrence (all users share the job&apos;s recurrence)
                    </span>
                  </label>

                  {(form.assignments?.length || 0) > 0 ? (
                    <div
                      className="rounded-lg"
                      style={{ border: '1px solid var(--color-divider)', background: 'var(--color-surface)' }}
                    >
                      <div className="flex flex-col">
                        {form.assignments?.map((assignment, index) => (
                          <div
                            key={assignment.id || `new-${index}`}
                            className="flex items-center justify-between gap-3 p-3"
                            style={{ borderBottom: index === (form.assignments?.length || 0) - 1 ? 'none' : '1px solid var(--color-divider)' }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className="avatar avatar-sm"
                                style={{ background: assignment.user?.colorHex || '#777', color: 'white' }}
                              >
                                {assignment.user?.displayName?.charAt(0) || '?'}
                              </span>
                              <div className="min-w-0">
                                <div style={{ color: 'var(--color-text)', fontWeight: 600 }}>
                                  {assignment.user?.displayName || 'Unknown User'}
                                </div>
                                {!form.useSharedRecurrence && (
                                  <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                                    {assignment.recurrence ? `Recurrence: ${assignment.recurrence}` : 'No individual recurrence'}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {!form.useSharedRecurrence && (
                                <button
                                  className="icon-btn icon-btn-sm"
                                  onClick={() => openEditAssignment(assignment)}
                                  aria-label="Edit assignment"
                                >
                                  <IconEdit />
                                </button>
                              )}
                              <button
                                className="icon-btn icon-btn-sm icon-btn-danger"
                                onClick={() => removeAssignment(assignment)}
                                aria-label="Remove assignment"
                              >
                                <IconTrash />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      No users assigned. Use “Add User” to assign users to this job.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={closeDialog}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={!canSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recurrence Modal */}
      <RecurrenceModal
        open={recurrenceUiOpen}
        onClose={closeRecurrence}
        value={{
          recurrence: (form.recurrence as string) || '',
          startDate: (form.recurrenceStartDate as string) || null,
          endDate: (form.recurrenceEndDate as string) || null,
          indefinite: Boolean(form.recurrenceIndefinite),
        }}
        onSave={(val) => {
          setForm((f) => ({
            ...f,
            recurrence: val.recurrence,
            recurrenceStartDate: val.startDate,
            recurrenceEndDate: val.indefinite ? null : (val.endDate || null),
            recurrenceIndefinite: val.indefinite,
          }));
          setRecurrenceUiOpen(false);
        }}
      />

      {/* Assignment Dialog */}
      {assignmentDialogOpen && (
        <div className="dialog-overlay" onClick={closeAssignmentDialog}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3 className="dialog-title">{editingAssignment ? 'Edit Assignment' : 'Add User Assignment'}</h3>
            </div>
            <div className="dialog-content">
              <div className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="label">User *</label>
                  <select
                    className="input select"
                    value={assignmentForm.userId || ''}
                    onChange={(e) => setAssignmentForm((f) => ({ ...f, userId: Number(e.target.value) }))}
                    disabled={!!editingAssignment}
                  >
                    <option value="" disabled>
                      Select a user
                    </option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                {!form.useSharedRecurrence && (
                  <div className="form-group">
                    <div className="flex items-center justify-between gap-3">
                      <label className="label" style={{ marginBottom: 0 }}>
                        Individual Recurrence
                      </label>
                      <button
                        className="btn btn-secondary text-sm"
                        style={{ minHeight: '36px' }}
                        onClick={() => setAssignmentRecurrenceOpen(true)}
                      >
                        Edit
                      </button>
                    </div>
                    <div
                      className="p-3 rounded-lg"
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-divider)' }}
                    >
                      <p style={{ color: 'var(--color-text)' }}>
                        {assignmentForm.recurrence
                          ? (assignmentForm.recurrence as string)
                          : 'No recurrence (uses job recurrence)'}
                      </p>
                      {assignmentForm.recurrence && (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                          Start:{' '}
                          {formatDateInput(
                            (assignmentForm.recurrenceStartDate as string) || (form.recurrenceStartDate as string)
                          )}
                          {assignmentForm.recurrenceIndefinite
                            ? ' (indefinite)'
                            : assignmentForm.recurrenceEndDate
                              ? ` → End: ${formatDateInput(assignmentForm.recurrenceEndDate as string)}`
                              : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={closeAssignmentDialog}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveAssignment} disabled={!assignmentForm.userId}>
                {editingAssignment ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Recurrence Modal */}
      <RecurrenceModal
        open={assignmentRecurrenceOpen}
        onClose={() => setAssignmentRecurrenceOpen(false)}
        value={{
          recurrence: (assignmentForm.recurrence as string) || '',
          startDate: (assignmentForm.recurrenceStartDate as string) || (form.recurrenceStartDate as string),
          endDate: (assignmentForm.recurrenceEndDate as string) || null,
          indefinite: Boolean(assignmentForm.recurrenceIndefinite),
        }}
        onSave={(val) => {
          setAssignmentForm((f) => ({
            ...f,
            recurrence: val.recurrence,
            recurrenceStartDate: val.startDate,
            recurrenceEndDate: val.indefinite ? null : (val.endDate || null),
            recurrenceIndefinite: val.indefinite,
          }));
          setAssignmentRecurrenceOpen(false);
        }}
      />
    </div>
  );
}
