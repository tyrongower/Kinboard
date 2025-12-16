'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CalendarTab from '@/components/kiosk/CalendarTab';
import JobsTab from '@/components/kiosk/JobsTab';
import ShoppingTab from '@/components/kiosk/ShoppingTab';
import WeatherWidget from '@/components/kiosk/WeatherWidget';

// Tab configuration
const tabs = [
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'jobs', label: 'Jobs', icon: '✓' },
  { id: 'shopping', label: 'Shopping', icon: '🛒' },
] as const;

type TabId = typeof tabs[number]['id'];

function getTabIndex(slug?: string): number {
  const idx = tabs.findIndex(t => t.id === slug?.toLowerCase());
  return idx >= 0 ? idx : 1; // default to 'jobs'
}

export default function KioskPage() {
  const params = useParams<{ tab?: string }>();
  const router = useRouter();

  const initialIndex = useMemo(() => getTabIndex(params?.tab), [params?.tab]);
  const [currentTab, setCurrentTab] = useState<number>(initialIndex);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Sync tab with URL
  useEffect(() => {
    setCurrentTab(getTabIndex(params?.tab));
  }, [params?.tab]);

  // Initialize date on client only (avoid hydration mismatch)
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
  }, [selectedDate]);

  const handleTabChange = (index: number) => {
    setCurrentTab(index);
    router.replace(`/kiosk/${tabs[index].id}`);
  };

  const handlePreviousDay = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const currentTabId = tabs[currentTab]?.id;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header 
        className="flex items-center gap-4 px-6 py-4 border-b justify-between"
        style={{ 
          background: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-divider)'
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 mr-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
            style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
          >
            K
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Kinboard
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Plan together. Do together.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="tab-list flex-1 max-w-md">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(index)}
              className={`tab flex-1 flex items-center justify-center gap-2 ${
                currentTab === index ? 'tab-active' : ''
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Date Navigation */}
        <div 
          className="flex items-center gap-1 px-2 py-1 rounded-xl"
          style={{ background: 'var(--color-surface)' }}
        >
          <button
            onClick={handlePreviousDay}
            className="btn-ghost w-10 h-10 rounded-lg text-xl"
            aria-label="Previous day"
          >
            ‹
          </button>
          <span 
            className="min-w-[140px] text-center font-medium px-2"
            style={{ color: 'var(--color-text)' }}
            suppressHydrationWarning
          >
            {selectedDate ? formatDate(selectedDate) : ''}
          </span>
          <button
            onClick={handleNextDay}
            className="btn-ghost w-10 h-10 rounded-lg text-xl"
            aria-label="Next day"
          >
            ›
          </button>
        </div>

        {/* Weather Widget */}
        <div className="hidden md:block float-right">
          <WeatherWidget />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {currentTabId === 'calendar' && selectedDate && (
          <CalendarTab selectedDate={selectedDate} onToday={handleToday} />
        )}
        {currentTabId === 'jobs' && selectedDate && (
          <JobsTab selectedDate={selectedDate} />
        )}
        {currentTabId === 'shopping' && (
          <ShoppingTab />
        )}
      </main>
    </div>
  );
}
