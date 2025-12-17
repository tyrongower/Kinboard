'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginOptionsPage() {
  const [checkingSetup, setCheckingSetup] = useState(true);
  const router = useRouter();

  // Check if setup is required on mount
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch('/api/setup/status');
        const data = await response.json();

        if (data.setupRequired) {
          router.push('/setup');
          return;
        }
      } catch (err) {
        // If setup endpoint fails, continue to login options
      } finally {
        setCheckingSetup(false);
      }
    };

    checkSetup();
  }, [router]);

  if (checkingSetup) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg)' }}
      >
        <div style={{ color: 'var(--color-text)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Logo/Brand */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4">
          <img src="/logo.svg" alt="Kinboard Logo" className="w-full h-full" />
        </div>
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--color-text)' }}
        >
          Kinboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Choose how to login
        </p>
      </div>

      {/* Login Options */}
      <div className="w-full max-w-md space-y-4">
        {/* Admin Login Option */}
        <button
          onClick={() => router.push('/admin/login')}
          className="card-elevated w-full p-6 text-left hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                Admin Login
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Login with email and password
              </div>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-text-muted)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </button>

        {/* Kiosk Token Option */}
        <button
          onClick={() => router.push('/login/kiosk')}
          className="card-elevated w-full p-6 text-left hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--color-success-muted)', color: 'var(--color-success)' }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                Kiosk Login
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Enter a kiosk token
              </div>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-text-muted)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </button>
      </div>

      {/* Footer */}
      <p
        className="mt-8 text-sm text-center"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Kinboard · Family organization dashboard
      </p>
    </div>
  );
}
