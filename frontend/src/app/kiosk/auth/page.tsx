'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function KioskAuthPage() {
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { authenticateKiosk, isAuthenticated, role } = useAuth();

  useEffect(() => {
    // If already authenticated as kiosk, redirect to kiosk view
    if (isAuthenticated && role === 'kiosk') {
      router.push('/kiosk');
      return;
    }

    const token = searchParams.get('token');

    if (!token) {
      setError('No kiosk token provided. Please use a valid kiosk URL.');
      setIsAuthenticating(false);
      return;
    }

    // Authenticate with kiosk token
    authenticateKiosk(token)
      .then(() => {
        router.push('/kiosk');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setIsAuthenticating(false);
      });
  }, [searchParams, authenticateKiosk, router, isAuthenticated, role]);

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
          <div className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            Authenticating...
          </div>
          <div style={{ color: 'var(--color-text-secondary)' }}>Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
      <div className="card max-w-md w-full p-8 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--color-error-muted)' }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-error)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-error)' }}>
          Authentication Failed
        </h1>
        <p className="text-lg mb-6" style={{ color: 'var(--color-text)' }}>
          {error}
        </p>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Please contact your administrator for a valid kiosk link.
        </p>
      </div>
    </div>
  );
}
