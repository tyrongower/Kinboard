'use client';

import { useState, useEffect } from 'react';
import { jobApi, jobAssignmentApi, Job, userApi, User, siteSettingsApi, SiteSettings } from '@/lib/api';

interface JobsTabProps {
  selectedDate: Date;
}

interface PersonJobs {
  userId: number | null;
  name: string;
  color: string;
  jobs: Job[];
  avatarUrl?: string | null;
}

export default function JobsTab({ selectedDate }: JobsTabProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Per-user hide completed toggle (default: hidden)
  const [hideCompletedByPerson, setHideCompletedByPerson] = useState<Record<string, boolean>>({});
  
  const personKey = (p: PersonJobs) => (p.userId != null ? `id:${p.userId}` : `name:${p.name}`);
  const isHiddenFor = (p: PersonJobs) => hideCompletedByPerson[personKey(p)] ?? true;
  
  const toggleHiddenFor = async (p: PersonJobs) => {
    const key = personKey(p);
    const newValue = !(hideCompletedByPerson[key] ?? true);
    setHideCompletedByPerson((prev) => ({ ...prev, [key]: newValue }));

    if (p.userId != null) {
      try {
        const u = users.find((x) => x.id === p.userId);
        if (u) {
          await userApi.update(u.id, { ...u, hideCompletedInKiosk: newValue });
          setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, hideCompletedInKiosk: newValue } : x)));
        }
      } catch (e) {
        console.error('Failed to persist hideCompletedInKiosk:', e);
        setHideCompletedByPerson((prev) => ({ ...prev, [key]: !newValue }));
      }
    }
  };

  useEffect(() => {
    loadJobs();
  }, [selectedDate]);

  useEffect(() => {
    (async () => {
      try {
        const [data, setts] = await Promise.all([userApi.getAll(), siteSettingsApi.get()]);
        setUsers(data);
        setSettings(setts);
        setHideCompletedByPerson((prev) => {
          const next = { ...prev };
          for (const u of data) {
            const key = `id:${u.id}`;
            if (next[key] === undefined) {
              next[key] = u.hideCompletedInKiosk ?? true;
            }
          }
          return next;
        });
      } catch (e) {
        console.error('Error loading users:', e);
      }
    })();
  }, []);

  // Auto refresh jobs
  useEffect(() => {
    const sec = Math.max(5, settings?.jobsRefreshSeconds ?? 10);
    const handle = setInterval(() => {
      loadJobs(true);
    }, sec * 1000);
    return () => clearInterval(handle);
  }, [settings?.jobsRefreshSeconds, selectedDate.toDateString()]);

  const loadJobs = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const data = await jobApi.getByDate(dateStr);
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleToggleJob = async (job: Job) => {
    try {
      const assignment = job.assignments?.[0];
      if (!assignment) {
        console.warn('No assignment found for job:', job.id);
        return;
      }
      
      const dateStr = selectedDate.toISOString().split('T')[0];
      const isCurrentlyCompleted = assignment.isCompleted ?? false;
      
      if (isCurrentlyCompleted) {
        await jobAssignmentApi.uncomplete(job.id, assignment.id, dateStr);
      } else {
        await jobAssignmentApi.complete(job.id, assignment.id, dateStr);
      }
      
      await loadJobs();
    } catch (error) {
      console.error('Error updating job:', error);
    }
  };

  const isJobCompleted = (job: Job): boolean => {
    const assignment = job.assignments?.[0];
    return assignment?.isCompleted ?? false;
  };

  const getCompletionPercentage = (jobsList: Job[]) => {
    if (jobsList.length === 0) return 0;
    const completed = jobsList.filter((c) => isJobCompleted(c)).length;
    return Math.round((completed / jobsList.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div 
            className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
          <span style={{ color: 'var(--color-text-secondary)' }}>Loading jobs...</span>
        </div>
      </div>
    );
  }

  // Build person jobs map
  const allPeople: PersonJobs[] = (() => {
    const fallbackColor = (label: string) => {
      const hash = Array.from(label).reduce((h, ch) => ((h << 5) - h) + ch.charCodeAt(0), 0);
      return `hsl(${Math.abs(hash) % 360} 70% 70%)`;
    };

    const byUserId = new Map<number, PersonJobs>();
    for (const u of users) {
      byUserId.set(u.id, { 
        userId: u.id, 
        name: u.displayName, 
        color: u.colorHex || fallbackColor(u.displayName), 
        jobs: [], 
        avatarUrl: u.avatarUrl 
      });
    }

    const unassignedLabel = 'Unassigned';
    let unassigned: PersonJobs | null = { 
      userId: null, 
      name: unassignedLabel, 
      color: fallbackColor(unassignedLabel), 
      jobs: [] 
    };

    for (const c of jobs) {
      const assignments = c.assignments || [];
      if (assignments.length > 0) {
        for (const assignment of assignments) {
          const uid = assignment.userId;
          if (byUserId.has(uid)) {
            const jobForUser: Job = {
              ...c,
              assignments: [assignment],
            };
            byUserId.get(uid)!.jobs.push(jobForUser);
          }
        }
      } else {
        if (!unassigned) {
          unassigned = { userId: null, name: unassignedLabel, color: fallbackColor(unassignedLabel), jobs: [] };
        }
        unassigned.jobs.push(c);
      }
    }

    const arr = Array.from(byUserId.values());
    if (unassigned && unassigned.jobs.length > 0) arr.push(unassigned);
    return arr;
  })();

  return (
    <div className="w-full">
      <div className="card-grid">
        {allPeople.map((person) => {
          const completed = person.jobs.filter((c) => isJobCompleted(c)).length;
          const total = person.jobs.length;
          const percentage = getCompletionPercentage(person.jobs);
          const hideCompleted = isHiddenFor(person);
          const visibleJobs = hideCompleted 
            ? person.jobs.filter((c) => !isJobCompleted(c)) 
            : person.jobs;

          return (
            <div key={personKey(person)} className="animate-slide-up">
              <div
                className="card h-full"
                style={{
                  background: `${person.color}14`,
                  borderColor: `${person.color}33`,
                }}
              >
                <div className="p-4 relative">
                  {/* Person Header */}
                  <div className="flex items-center gap-3 mb-4">
                    {person.avatarUrl ? (
                      <img
                        src={person.avatarUrl}
                        alt={person.name}
                        className="avatar avatar-lg object-cover"
                        style={{ border: `2px solid ${person.color}` }}
                      />
                    ) : (
                      <div
                        className="avatar avatar-lg"
                        style={{ background: person.color, color: 'white' }}
                      >
                        {person.name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="font-bold text-lg truncate"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {person.name}
                      </h3>
                      <p style={{ color: 'var(--color-text-secondary)' }}>
                        {completed} of {total} completed
                      </p>
                    </div>
                  </div>

                  {/* Toggle visibility button */}
                  <button
                    onClick={() => toggleHiddenFor(person)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ 
                      background: 'var(--color-surface)',
                      color: hideCompleted ? 'var(--color-text-muted)' : 'var(--color-text)'
                    }}
                    title={hideCompleted ? 'Show completed' : 'Hide completed'}
                  >
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      {hideCompleted ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>

                  {/* Progress Bar */}
                  <div className="progress-bar mb-4">
                    <div
                      className="progress-bar-fill"
                      style={{ 
                        width: `${percentage}%`,
                        background: person.color 
                      }}
                    />
                  </div>

                  {/* Jobs List */}
                  <div className="flex flex-col gap-2">
                    {visibleJobs.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-6">
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                          style={{ background: 'var(--color-success-muted)' }}
                        >
                          <svg 
                            width="32" 
                            height="32" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="var(--color-success)" 
                            strokeWidth="2.5"
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <p 
                          className="font-medium"
                          style={{ color: 'var(--color-success)' }}
                        >
                          All done!
                        </p>
                      </div>
                    )}
                    
                    {visibleJobs.map((job) => {
                      const completed = isJobCompleted(job);
                      return (
                        <button
                          key={job.id}
                          onClick={() => handleToggleJob(job)}
                          className="flex items-center gap-3 p-3 rounded-xl transition-all text-left w-full group"
                          style={{
                            background: completed ? 'transparent' : 'var(--color-surface)',
                            border: `1px solid ${completed ? 'transparent' : 'var(--color-divider)'}`,
                            boxShadow: completed ? 'none' : 'var(--shadow-sm)',
                          }}
                        >
                          {/* Job Image */}
                          {job.imageUrl && (
                            <img
                              src={job.imageUrl}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover shrink-0"
                              style={{ opacity: completed ? 0.5 : 1 }}
                            />
                          )}
                          
                          {/* Job Content */}
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-semibold text-base truncate"
                              style={{
                                color: completed ? 'var(--color-text-muted)' : 'var(--color-text)',
                                textDecoration: completed ? 'line-through' : 'none',
                              }}
                            >
                              {job.title}
                            </p>
                            {job.description && (
                              <p
                                className="text-sm truncate mt-0.5"
                                style={{ 
                                  color: 'var(--color-text-secondary)',
                                  opacity: completed ? 0.6 : 1 
                                }}
                              >
                                {job.description}
                              </p>
                            )}
                          </div>

                          {/* Checkbox */}
                          <div
                            className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all group-hover:scale-110`}
                            style={{
                              borderColor: completed ? person.color : 'var(--color-divider)',
                              background: completed ? person.color : 'transparent',
                            }}
                          >
                            {completed && (
                              <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="white" 
                                strokeWidth="3"
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
