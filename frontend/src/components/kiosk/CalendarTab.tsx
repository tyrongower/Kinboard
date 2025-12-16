'use client';

import { useEffect, useMemo, useState } from 'react';
import { 
  CalendarEventItem, 
  SiteSettings, 
  CalendarSource, 
  calendarEventsApi, 
  siteSettingsApi, 
  calendarsApi, 
  jobApi, 
  userApi, 
  User 
} from '@/lib/api';

type ViewType = 'Day' | 'Week' | 'Month';

// Date utility functions
function startOfWeekMonday(d: Date) {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = (day + 6) % 7;
  dt.setDate(dt.getDate() - diff);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function endOfWeekMonday(d: Date) {
  const start = startOfWeekMonday(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return end;
}

function monthRange(d: Date) {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const start = startOfWeekMonday(first);
  const end = endOfWeekMonday(new Date(last.getFullYear(), last.getMonth(), last.getDate()));
  return { start, end };
}

function dayRange(d: Date) {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function sameDayOverlap(d: Date, e: CalendarEventItem) {
  const start = new Date(e.start);
  const end = new Date(e.end);
  const dayStart = new Date(d);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return end > dayStart && start < dayEnd;
}

function formatTimeRange(e: CalendarEventItem) {
  if (e.allDay) return 'All day';
  const s = new Date(e.start);
  const en = new Date(e.end);
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  return `${s.toLocaleTimeString([], opts)} – ${en.toLocaleTimeString([], opts)}`;
}

interface Props {
  selectedDate: Date;
  onToday?: () => void;
}

export default function CalendarTab({ selectedDate, onToday }: Props) {
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<CalendarSource[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [view, setView] = useState<ViewType>('Day');
  const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set());
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const hasMultipleSources = sources.length > 1;

  // Initial data load
  useEffect(() => {
    (async () => {
      const [srcs, setts, us] = await Promise.all([
        calendarsApi.getAll(),
        siteSettingsApi.get(),
        userApi.getAll()
      ]);
      setSources(srcs);
      setSettings(setts);
      setView((setts?.defaultView as ViewType) ?? 'Day');
      setVisibleIds(new Set(srcs.filter(s => s.enabled).map(s => s.id)));
      setUsers(us);
      setLoading(false);
    })();
  }, []);

  // Calculate date range based on view
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (view === 'Day') {
      const r = dayRange(selectedDate);
      return { rangeStart: r.start, rangeEnd: r.end };
    }
    if (view === 'Week') {
      return { rangeStart: startOfWeekMonday(selectedDate), rangeEnd: endOfWeekMonday(selectedDate) };
    }
    const r = monthRange(selectedDate);
    return { rangeStart: r.start, rangeEnd: r.end };
  }, [selectedDate, view]);

  // Fetch events
  useEffect(() => {
    if (loading) return;
    const ids = Array.from(visibleIds);
    
    const fetchEvents = async () => {
      try {
        const data = await calendarEventsApi.get(rangeStart.toISOString(), rangeEnd.toISOString(), ids);
        setEvents(data);
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      }
    };
    
    fetchEvents();
    const intervalSec = Math.max(5, settings?.calendarRefreshSeconds ?? 30);
    const handle = setInterval(fetchEvents, intervalSec * 1000);
    return () => clearInterval(handle);
  }, [loading, settings?.calendarRefreshSeconds, rangeStart.toISOString(), rangeEnd.toISOString(), JSON.stringify(Array.from(visibleIds))]);

  // Completion pills data
  const [pillsData, setPillsData] = useState<Record<number, { total: number; open: number }>>({});

  useEffect(() => {
    if (!settings) return;
    const mode = settings.completionMode ?? 'Today';
    const r = mode === 'Today' ? dayRange(selectedDate) : { start: rangeStart, end: rangeEnd };
    const dates: string[] = [];
    const cursor = new Date(r.start);
    while (cursor < r.end) {
      dates.push(cursor.toISOString().split('T')[0]);
      cursor.setDate(cursor.getDate() + 1);
    }
    
    (async () => {
      const results = await Promise.allSettled(dates.map(d => jobApi.getByDate(d)));
      const map: Record<number, { total: number; open: number }> = {};
      for (const res of results) {
        if (res.status !== 'fulfilled') continue;
        for (const c of res.value) {
          if (c.assignments && c.assignments.length > 0) {
            for (const assignment of c.assignments) {
              const uid = assignment.userId;
              if (!map[uid]) map[uid] = { total: 0, open: 0 };
              map[uid].total += 1;
              if (!assignment.isCompleted) map[uid].open += 1;
            }
          }
        }
      }
      setPillsData(map);
    })();
  }, [settings?.completionMode, selectedDate.toDateString(), rangeStart.toISOString(), rangeEnd.toISOString()]);

  const toggleSource = (id: number) => {
    setVisibleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div 
            className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
          <span style={{ color: 'var(--color-text-secondary)' }}>Loading calendar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* User completion pills */}
      <div className="flex flex-wrap gap-2 justify-center">
        {users.map(u => {
          const stat = pillsData[u.id] ?? { total: 0, open: 0 };
          return (
            <div
              key={u.id}
              className="pill"
              style={{
                background: `${u.colorHex}22`,
                borderColor: `${u.colorHex}55`,
              }}
            >
              <div
                className="avatar avatar-sm"
                style={{ background: u.colorHex, color: 'white' }}
              >
                {u.displayName[0]}
              </div>
              <span style={{ color: 'var(--color-text)' }}>
                {u.displayName} <span style={{ color: 'var(--color-text-secondary)' }}>{stat.open}/{stat.total || 0}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-4">
        {/* View selector */}
        <div className="tab-list">
          {(['Day', 'Week', 'Month'] as ViewType[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`tab px-4 ${view === v ? 'tab-active' : ''}`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {hasMultipleSources && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary"
            >
              Filter
            </button>
          )}
          <button onClick={onToday} className="btn btn-primary">
            Today
          </button>
        </div>
      </div>

      {/* Calendar source filters */}
      {hasMultipleSources && showFilters && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {sources.map(s => (
            <button
              key={s.id}
              onClick={() => toggleSource(s.id)}
              className="pill cursor-pointer transition-all"
              style={{
                background: visibleIds.has(s.id) ? s.colorHex : 'transparent',
                borderColor: s.colorHex,
                color: visibleIds.has(s.id) ? 'white' : 'var(--color-text)',
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Calendar views */}
      <div className="flex-1 overflow-auto">
        {view === 'Day' && <DayView date={selectedDate} events={events} />}
        {view === 'Week' && <WeekView date={selectedDate} events={events} />}
        {view === 'Month' && <MonthView date={selectedDate} events={events} />}
      </div>
    </div>
  );
}

// Day View Component
function DayView({ date, events }: { date: Date; events: CalendarEventItem[] }) {
  const { start, end } = dayRange(date);
  const list = events.filter(e => new Date(e.end) > start && new Date(e.start) < end);

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-5xl mb-4">📭</div>
        <p style={{ color: 'var(--color-text-secondary)' }}>No events scheduled</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {list.map((e, idx) => (
        <EventCard key={idx} event={e} />
      ))}
    </div>
  );
}

// Week View Component
function WeekView({ date, events }: { date: Date; events: CalendarEventItem[] }) {
  const start = startOfWeekMonday(date);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="grid grid-cols-7 gap-3">
      {days.map((d, i) => {
        const isToday = d.toDateString() === today.toDateString();
        const dayEvents = events.filter(e => sameDayOverlap(d, e));
        
        return (
          <div
            key={i}
            className="card p-3 min-h-[140px]"
            style={{
              borderColor: isToday ? 'var(--color-primary)' : 'var(--color-divider)',
              borderWidth: isToday ? '2px' : '1px',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span 
                className={`text-sm font-semibold ${isToday ? '' : ''}`}
                style={{ color: isToday ? 'var(--color-primary)' : 'var(--color-text)' }}
              >
                {d.toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
              <span 
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${isToday ? '' : ''}`}
                style={{ 
                  background: isToday ? 'var(--color-primary)' : 'transparent',
                  color: isToday ? 'white' : 'var(--color-text-secondary)'
                }}
              >
                {d.getDate()}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {dayEvents.slice(0, 4).map((e, idx) => (
                <EventChip key={idx} event={e} />
              ))}
              {dayEvents.length > 4 && (
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  +{dayEvents.length - 4} more
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Month View Component
function MonthView({ date, events }: { date: Date; events: CalendarEventItem[] }) {
  const { start, end } = monthRange(date);
  const days: Date[] = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMonth = date.getMonth();

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Day headers */}
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
        <div 
          key={day} 
          className="text-center text-sm font-medium py-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {day}
        </div>
      ))}
      
      {/* Day cells */}
      {days.map((d, idx) => {
        const isToday = d.toDateString() === today.toDateString();
        const isCurrentMonth = d.getMonth() === currentMonth;
        const dayEvents = events.filter(e => sameDayOverlap(d, e));

        return (
          <div
            key={idx}
            className="card p-2 min-h-[100px]"
            style={{
              opacity: isCurrentMonth ? 1 : 0.5,
              borderColor: isToday ? 'var(--color-primary)' : 'var(--color-divider)',
              borderWidth: isToday ? '2px' : '1px',
            }}
          >
            <span 
              className={`text-sm font-semibold ${isToday ? 'w-6 h-6 rounded-full flex items-center justify-center' : ''}`}
              style={{ 
                background: isToday ? 'var(--color-primary)' : 'transparent',
                color: isToday ? 'white' : 'var(--color-text)'
              }}
            >
              {d.getDate()}
            </span>
            <div className="flex flex-col gap-0.5 mt-1">
              {dayEvents.slice(0, 3).map((e, j) => (
                <EventDot key={j} event={e} />
              ))}
              {dayEvents.length > 3 && (
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  +{dayEvents.length - 3}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Event Card (for Day view - full details)
function EventCard({ event }: { event: CalendarEventItem }) {
  return (
    <div
      className="card p-4 animate-slide-up"
      style={{
        background: `${event.colorHex}14`,
        borderColor: `${event.colorHex}55`,
        borderLeftWidth: '4px',
        borderLeftColor: event.colorHex,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 
            className="font-semibold text-lg truncate"
            style={{ color: 'var(--color-text)' }}
          >
            {event.title}
          </h3>
          <p 
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {formatTimeRange(event)}
          </p>
        </div>
        <span 
          className="text-xs px-2 py-1 rounded-full shrink-0"
          style={{ 
            background: `${event.colorHex}22`,
            color: event.colorHex 
          }}
        >
          {event.sourceName}
        </span>
      </div>
    </div>
  );
}

// Event Chip (for Week view - compact)
function EventChip({ event }: { event: CalendarEventItem }) {
  return (
    <div
      className="text-xs px-2 py-1 rounded-md truncate"
      style={{
        background: `${event.colorHex}22`,
        borderLeft: `3px solid ${event.colorHex}`,
        color: 'var(--color-text)',
      }}
      title={`${formatTimeRange(event)} - ${event.title}`}
    >
      <span style={{ color: 'var(--color-text-muted)' }}>{formatTimeRange(event).split(' – ')[0]}</span>{' '}
      {event.title}
    </div>
  );
}

// Event Dot (for Month view - minimal)
function EventDot({ event }: { event: CalendarEventItem }) {
  return (
    <div
      className="text-xs px-1.5 py-0.5 rounded truncate"
      style={{
        background: `${event.colorHex}33`,
        color: 'var(--color-text)',
      }}
      title={event.title}
    >
      {event.title}
    </div>
  );
}
