'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Don't redirect if we're on the auth page
    if (pathname === '/kiosk/auth') return;

    // If not authenticated, stay on page (kiosks don't auto-redirect)
    // They need a valid token URL to authenticate
    if (!isAuthenticated) {
      // Show error message or just stay on page
      return;
    }

    // Admin users can access kiosk pages (full access)
    // Kiosk users can access kiosk pages
    // No redirects needed - both roles have access
  }, [isAuthenticated, isLoading, role, router, pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
          <div className="text-xl" style={{ color: 'var(--color-text)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  // If not authenticated and not on auth page, redirect to login options
  if (!isAuthenticated && pathname !== '/kiosk/auth') {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
}
