'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import UsersAdmin from '@/components/admin/UsersAdmin';
import JobsAdmin from '@/components/admin/JobsAdmin';
import CalendarsAdmin from '@/components/admin/CalendarsAdmin';
import SiteSettingsAdmin from '@/components/admin/SiteSettingsAdmin';
import ShoppingAdmin from '@/components/admin/ShoppingAdmin';

const tabs = [
  { id: 'jobs', label: 'Jobs', icon: '✓' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'calendars', label: 'Calendars', icon: '📅' },
  { id: 'shopping', label: 'Shopping', icon: '🛒' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
] as const;

type TabId = typeof tabs[number]['id'];

function getTabIndex(slug?: string): number {
  const idx = tabs.findIndex(t => t.id === slug?.toLowerCase());
  return idx >= 0 ? idx : 0; // default to 'jobs'
}

export default function AdminTabbedPage() {
  const params = useParams<{ tab?: string }>();
  const router = useRouter();

  const initialIndex = useMemo(() => getTabIndex(params?.tab), [params?.tab]);
  const [currentTab, setCurrentTab] = useState<number>(initialIndex);

  const adminEnabled = useMemo(() => {
    if (typeof window === 'undefined') return true;
    const flag = process.env.NEXT_PUBLIC_ENABLE_ADMIN;
    return flag === undefined || flag === '1' || flag?.toLowerCase() === 'true';
  }, []);

  // Keep state in sync if the URL param changes (e.g., via back/forward)
  useEffect(() => {
    const idx = getTabIndex(params?.tab);
    setCurrentTab(idx);
  }, [params?.tab]);

  const handleTabChange = (index: number) => {
    setCurrentTab(index);
    router.replace(`/admin/${tabs[index].id}`);
  };

  const currentTabId = tabs[currentTab]?.id;

  return (
    <div className="min-h-screen flex flex-col " style={{ background: 'var(--color-bg)' }}>
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
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Kinboard
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Admin Dashboard
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="tab-list flex-1 ">
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

        {/* Back to Kiosk link */}
        <a
          href="/kiosk/jobs"
          className="btn btn-secondary text-sm"
          style={{ minHeight: '40px' }}
        >
          ← Back to Kiosk
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          {!adminEnabled ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔒</div>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Admin is disabled.
              </p>
            </div>
          ) : (
            <>
              <div className={currentTabId === 'jobs' ? '' : 'hidden'}>
                <JobsAdmin />
              </div>
              <div className={currentTabId === 'users' ? '' : 'hidden'}>
                <UsersAdmin />
              </div>
              <div className={currentTabId === 'calendars' ? '' : 'hidden'}>
                <CalendarsAdmin />
              </div>
              <div className={currentTabId === 'shopping' ? '' : 'hidden'}>
                <ShoppingAdmin />
              </div>
              <div className={currentTabId === 'settings' ? '' : 'hidden'}>
                <SiteSettingsAdmin />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
