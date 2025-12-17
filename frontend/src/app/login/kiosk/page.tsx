'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function KioskTokenLoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { authenticateKiosk } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authenticateKiosk(token);
      router.push('/kiosk');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
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
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--color-text)' }}
        >
          Kinboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Kiosk Login
        </p>
      </div>

      {/* Back Button */}
      <button
        onClick={() => router.push('/login')}
        className="mb-4 flex items-center gap-2 text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to login options
      </button>

      {/* Token Form */}
      <div className="card-elevated w-full max-w-md p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text)' }}
            >
              Kiosk Token
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              autoComplete="off"
              className="w-full px-4 py-3 rounded-lg border transition-all font-mono"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-divider)',
                color: 'var(--color-text)',
              }}
              placeholder="Enter your kiosk token"
              disabled={isLoading}
            />
            <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Enter the token provided by your administrator
            </p>
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
            {isLoading ? 'Authenticating...' : 'Login'}
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
