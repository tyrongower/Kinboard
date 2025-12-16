'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const firstMenuFocusableRef = useRef<HTMLButtonElement | null>(null);

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

  // Close drawer on Escape, basic focus management
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    if (isMenuOpen) {
      document.addEventListener('keydown', onKey);
      // send focus to first control after open
      setTimeout(() => firstMenuFocusableRef.current?.focus(), 0);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

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
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Desktop Header (≥1450px) */}
      <header
        className="hidden min-[1450px]:flex flex-wrap items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b justify-between"
        style={{
          background: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-divider)'
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 mr-0 sm:mr-4 flex-shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold">
            <img src="/favicon.svg" alt="Logo"/>
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
        <nav className="tab-list flex-1 max-w-full sm:max-w-md min-w-0 order-last sm:order-none mt-2 sm:mt-0">
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
          className="flex items-center gap-1 px-2 py-1 rounded-xl flex-shrink-0"
          style={{ background: 'var(--color-surface)' }}
        >
          <button
            onClick={handlePreviousDay}
            className="btn-ghost rounded-lg text-xl"
            style={{ minWidth: 'var(--touch-target)', minHeight: 'var(--touch-target)' }}
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
            className="btn-ghost rounded-lg text-xl"
            style={{ minWidth: 'var(--touch-target)', minHeight: 'var(--touch-target)' }}
            aria-label="Next day"
          >
            ›
          </button>
        </div>

        {/* Weather Widget */}
        <div className="hidden md:block flex-shrink-0">
          <WeatherWidget />
        </div>
      </header>

      {/* Compact Header (<1450px) */}
      <header
        className="flex min-[1450px]:hidden items-center justify-between gap-3 px-4 py-3 border-b"
        style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-divider)' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
            style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
          >
            K
          </div>
          <span className="hidden sm:block font-semibold" style={{ color: 'var(--color-text)' }}>Kinboard</span>
        </div>

        {/* Center: Tab title + date */}
        <div className="flex-1 min-w-0 text-center">
          <div className="flex items-center justify-center gap-2 truncate">
            <span className="text-base font-medium truncate" style={{ color: 'var(--color-text)' }}>
              {tabs[currentTab]?.label}
            </span>
            <span className="hidden xs:inline text-sm truncate" style={{ color: 'var(--color-text-secondary)' }} suppressHydrationWarning>
              {selectedDate ? formatDate(selectedDate) : ''}
            </span>
          </div>
        </div>

        {/* Right: Menu button */}
        <button
          className="rounded-lg"
          style={{ width: 'var(--touch-target-lg)', height: 'var(--touch-target-lg)' }}
          aria-label="Open menu"
          onClick={() => setIsMenuOpen(true)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* Drawer / Sheet for small screens */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Kiosk menu"
        >
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setIsMenuOpen(false)} />

          {/* Panel */}
          <div
            className="relative ml-auto mr-auto w-full max-w-[800px] rounded-b-2xl border shadow-lg animate-slide-up"
            style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-divider)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-divider)' }}>
              <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Menu</span>
              <button
                className="rounded-lg"
                style={{ width: 'var(--touch-target)', height: 'var(--touch-target)' }}
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* Tabs */}
              <div className="grid grid-cols-3 gap-2">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    ref={index === 0 ? firstMenuFocusableRef : undefined}
                    onClick={() => { handleTabChange(index); setIsMenuOpen(false); }}
                    className={`tab ${currentTab === index ? 'tab-active' : ''} w-full flex items-center justify-center gap-2`}
                    style={{ minHeight: 'var(--touch-target-lg)' }}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Date controls */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => { handlePreviousDay(); }}
                  className="btn-secondary"
                  style={{ minWidth: 'var(--touch-target-lg)', minHeight: 'var(--touch-target-lg)' }}
                  aria-label="Previous day"
                >
                  ‹
                </button>
                <button
                  onClick={() => { handleToday(); }}
                  className="btn-primary"
                  style={{ minWidth: '120px', minHeight: 'var(--touch-target-lg)' }}
                >
                  Today
                </button>
                <button
                  onClick={() => { handleNextDay(); }}
                  className="btn-secondary"
                  style={{ minWidth: 'var(--touch-target-lg)', minHeight: 'var(--touch-target-lg)' }}
                  aria-label="Next day"
                >
                  ›
                </button>
              </div>

              {/* Weather */}
              <div className="mt-2">
                <WeatherWidget />
              </div>

              {/* Close */}
              <div className="flex justify-center pt-2">
                <button
                  className="btn-secondary"
                  style={{ minWidth: '200px' }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
