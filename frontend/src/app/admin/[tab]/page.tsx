'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import UsersAdmin from '@/components/admin/UsersAdmin';
import JobsAdmin from '@/components/admin/JobsAdmin';
import CalendarsAdmin from '@/components/admin/CalendarsAdmin';
import SiteSettingsAdmin from '@/components/admin/SiteSettingsAdmin';
import ShoppingAdmin from '@/components/admin/ShoppingAdmin';
import KioskTokensAdmin from '@/components/admin/KioskTokensAdmin';
import Link from "next/link";

const tabs = [
  { id: 'jobs', label: 'Jobs', icon: '✓' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'kiosk', label: 'Kiosk Tokens', icon: '🔑' },
  { id: 'calendars', label: 'Calendars', icon: '📅' },
  { id: 'shopping', label: 'Shopping', icon: '🛒' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
] as const;


function getTabIndex(slug?: string): number {
  const idx = tabs.findIndex(t => t.id === slug?.toLowerCase());
  return idx >= 0 ? idx : 0;
}

export default function AdminTabbedPage() {
  const params = useParams<{ tab?: string }>();
  const router = useRouter();

  const currentTabIndex = useMemo(() => getTabIndex(params?.tab), [params?.tab]);
  const currentTabId = tabs[currentTabIndex]?.id;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const firstMenuFocusableRef = useRef<HTMLButtonElement | null>(null);

  const adminEnabled = useMemo(() => {
    if (typeof window === 'undefined') return true;
    const flag = process.env.NEXT_PUBLIC_ENABLE_ADMIN;
    return flag === undefined || flag === '1' || flag?.toLowerCase() === 'true';
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    if (isMenuOpen) {
      document.addEventListener('keydown', onKey);
      setTimeout(() => firstMenuFocusableRef.current?.focus(), 0);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

  const handleTabChange = (index: number) => {
    router.replace(`/admin/${tabs[index].id}`);
  };

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden" style={{ background: 'var(--color-bg)' }}>
      <header
        className="hidden min-[1450px]:flex flex-wrap items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b justify-between"
        style={{
          background: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-divider)'
        }}
      >
        <div className="flex items-center gap-3 mr-0 sm:mr-4 shrink-0">
          <div className="w-10 h-10">
            <img src="/logo.svg" alt="Kinboard Logo" className="w-full h-full" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Kinboard
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Admin Dashboard
            </p>
          </div>
        </div>

        <nav className="tab-list flex-1 min-w-0 order-last sm:order-0 mt-2 sm:mt-0">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(index)}
              className={`tab flex-1 flex items-center justify-center gap-2 ${
                currentTabIndex === index ? 'tab-active' : ''
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        <Link
          href="/kiosk/jobs"
          className="btn btn-secondary text-sm shrink-0"
          style={{ minHeight: 'var(--touch-target)' }}
        >
          ← Back to Kiosk
        </Link>
      </header>

      <header
        className="flex min-[1450px]:hidden items-center justify-between gap-3 px-4 py-3 border-b"
        style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-divider)' }}
      >
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10">
            <img src="/logo.svg" alt="Kinboard Logo" className="w-full h-full" />
          </div>
          <span className="hidden sm:block font-semibold" style={{ color: 'var(--color-text)' }}>Kinboard</span>
        </div>

        <div className="flex-1 min-w-0 text-center">
          <div className="flex items-center justify-center gap-2 truncate">
            <span className="text-base font-medium truncate" style={{ color: 'var(--color-text)' }}>
              {tabs[currentTabIndex]?.label}
            </span>
          </div>
        </div>

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

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Admin menu"
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setIsMenuOpen(false)} />

          <div
            className="relative ml-auto mr-auto w-full max-w-200 rounded-b-2xl border shadow-lg animate-slide-up"
            style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-divider)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-divider)' }}>
              <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Admin Menu</span>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    ref={index === 0 ? firstMenuFocusableRef : undefined}
                    onClick={() => { handleTabChange(index); setIsMenuOpen(false); }}
                    className={`tab ${currentTabIndex === index ? 'tab-active' : ''} w-full flex items-center justify-center gap-2`}
                    style={{ minHeight: 'var(--touch-target-lg)' }}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2">
                <Link
                  href="/kiosk/jobs"
                  className="btn btn-secondary"
                  style={{ minWidth: '200px', minHeight: 'var(--touch-target-lg)' }}
                >
                  ← Back to Kiosk
                </Link>
              </div>

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
              <div className={currentTabId === 'kiosk' ? '' : 'hidden'}>
                <KioskTokensAdmin />
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
