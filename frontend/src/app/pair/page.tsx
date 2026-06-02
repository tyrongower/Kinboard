'use client';

import { Suspense, useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { deviceApi } from '@/lib/api';
import { getDeviceInfo, DeviceInfo } from '@/lib/auth';

type Phase = 'loading' | 'login' | 'approve' | 'approving' | 'done' | 'error';

function PairContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const { isAuthenticated, role, login, isLoading: authLoading } = useAuth();

  const [phase, setPhase] = useState<Phase>('loading');
  const [message, setMessage] = useState('');
  const [info, setInfo] = useState<DeviceInfo | null>(null);

  // Admin login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Validate the pairing code once on mount.
  useEffect(() => {
    if (!code) {
      setPhase('error');
      setMessage('No pairing code provided. Scan the QR code shown on your TV.');
      return;
    }

    getDeviceInfo(code)
      .then((di) => {
        setInfo(di);
        if (!di.found || di.status === 'unknown') {
          setPhase('error');
          setMessage('This pairing code is not valid. Restart pairing on your TV.');
        } else if (di.status === 'expired') {
          setPhase('error');
          setMessage('This pairing code has expired. Restart pairing on your TV.');
        } else if (di.status === 'approved' || di.status === 'consumed') {
          setPhase('done');
          setMessage('This TV has already been connected.');
        }
        // pending -> wait for auth effect below to pick login vs approve.
      })
      .catch(() => {
        setPhase('error');
        setMessage('Could not reach the server. Check your connection and try again.');
      });
  }, [code]);

  // Once the code is confirmed pending, decide login vs approve based on auth.
  useEffect(() => {
    if (authLoading) return;
    if (!info || !info.found) return;
    if (info.status !== 'pending') return;
    if (phase === 'approving' || phase === 'done') return;

    if (isAuthenticated && role === 'admin') {
      setPhase('approve');
    } else {
      setPhase('login');
    }
  }, [authLoading, info, isAuthenticated, role, phase]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      await login(email, password);
      // Auth effect will flip the phase to 'approve'.
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleApprove = async () => {
    if (!code) return;
    setPhase('approving');
    try {
      await deviceApi.approve(code);
      setPhase('done');
      setMessage('Your TV is now connected. You can close this page.');
    } catch (err) {
      setPhase('error');
      setMessage(err instanceof Error ? err.message : 'Failed to connect TV');
    }
  };

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
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          Kinboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Connect your TV</p>
      </div>

      <div className="card-elevated w-full max-w-md p-6 sm:p-8">
        {phase === 'loading' && (
          <div className="text-center py-6" style={{ color: 'var(--color-text-secondary)' }}>
            <div
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
            />
            Checking pairing code…
          </div>
        )}

        {phase === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Log in as an administrator to connect this TV to your Kinboard.
            </p>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg border transition-all"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-divider)',
                  color: 'var(--color-text)',
                }}
                placeholder="admin@example.com"
                disabled={loggingIn}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-lg border transition-all"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-divider)',
                  color: 'var(--color-text)',
                }}
                placeholder="••••••••"
                disabled={loggingIn}
              />
            </div>
            {loginError && (
              <div
                className="p-4 rounded-lg border text-sm"
                style={{
                  background: 'var(--color-error-muted)',
                  borderColor: 'var(--color-error)',
                  color: 'var(--color-error)',
                }}
              >
                {loginError}
              </div>
            )}
            <button type="submit" disabled={loggingIn} className="btn btn-primary w-full">
              {loggingIn ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        )}

        {(phase === 'approve' || phase === 'approving') && (
          <div className="text-center space-y-6">
            <p className="text-lg" style={{ color: 'var(--color-text)' }}>
              Connect this TV to your Kinboard?
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              The TV will be signed in and show your family dashboard.
            </p>
            <button
              onClick={handleApprove}
              disabled={phase === 'approving'}
              className="btn btn-primary w-full"
            >
              {phase === 'approving' ? 'Connecting…' : 'Connect TV'}
            </button>
          </div>
        )}

        {phase === 'done' && (
          <div className="text-center space-y-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: 'var(--color-success-muted, var(--color-surface))' }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              TV connected
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
          </div>
        )}

        {phase === 'error' && (
          <div className="text-center space-y-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: 'var(--color-error-muted)' }}
            >
              <svg
                width="40"
                height="40"
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
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-error)' }}>
              Pairing failed
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
          </div>
        )}
      </div>

      <p className="mt-8 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
        Kinboard · Family organization dashboard
      </p>
    </div>
  );
}

export default function PairPage() {
  return (
    <Suspense fallback={null}>
      <PairContent />
    </Suspense>
  );
}
