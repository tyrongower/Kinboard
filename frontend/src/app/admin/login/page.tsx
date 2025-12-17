'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const { login } = useAuth();
  const router = useRouter();

  // Check if setup is required on mount
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch('/api/setup/status');
        const data = await response.json();

        if (data.setupRequired) {
          router.push('/setup');
        }
      } catch (err) {
        // If setup endpoint fails, continue to login
      } finally {
        setCheckingSetup(false);
      }
    };

    checkSetup();
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

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
          Admin Login
        </p>
      </div>

      {/* Login Form */}
      <div
        className="card-elevated w-full max-w-md p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          {error && (
            <div
              className="p-4 rounded-lg border text-sm"
              style={{
                background: 'var(--color-error-muted)',
                borderColor: 'var(--color-error)',
                color: 'var(--color-error)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
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
