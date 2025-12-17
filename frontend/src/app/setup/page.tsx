'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  displayName: string;
  email: string | null;
  isAdmin: boolean;
}

interface SetupStatus {
  setupRequired: boolean;
  hasUsers: boolean;
  users: User[];
}

export default function SetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Form fields
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      // Check if setup is needed
      const statusRes = await fetch('/api/setup/status');
      const statusData = await statusRes.json();

      setStatus({
        setupRequired: statusData.setupRequired,
        hasUsers: statusData.hasUsers,
        users: statusData.users || [],
      });

      if (!statusData.setupRequired) {
        // Admin already exists, redirect to login
        router.push('/login');
      }
    } catch (err) {
      setError('Failed to check setup status');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (selectedUserId) {
        // Update existing user with credentials
        const response = await fetch(`/api/setup/init-admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedUserId,
            email,
            password,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to set admin credentials');
        }
      } else {
        // Create new admin user
        const response = await fetch('/api/setup/init-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            displayName,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to create admin user');
        }
      }

      setSuccess('Admin user created successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !status) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg)' }}
      >
        <div style={{ color: 'var(--color-text)' }}>Loading...</div>
      </div>
    );
  }

  const hasExistingUsers = status && status.hasUsers;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
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
          Kinboard Setup
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Create your admin account
        </p>
      </div>

      {/* Setup Form */}
      <div className="card-elevated w-full max-w-md p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Choose existing user or create new */}
          {hasExistingUsers && (
            <div>
              <label
                className="block text-sm font-medium mb-3"
                style={{ color: 'var(--color-text)' }}
              >
                Select User to Make Admin
              </label>
              <div className="space-y-2">
                {/* Option: Create new user */}
                <label
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                  style={{
                    background: selectedUserId === null ? 'var(--color-primary-muted)' : 'var(--color-surface)',
                    borderColor: selectedUserId === null ? 'var(--color-primary)' : 'var(--color-divider)',
                  }}
                >
                  <input
                    type="radio"
                    name="userSelection"
                    checked={selectedUserId === null}
                    onChange={() => setSelectedUserId(null)}
                    className="w-5 h-5"
                  />
                  <div>
                    <div style={{ color: 'var(--color-text)', fontWeight: 500 }}>
                      Create New Admin User
                    </div>
                    <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Start fresh with a new account
                    </div>
                  </div>
                </label>

                {/* Existing users */}
                {status?.users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                    style={{
                      background: selectedUserId === user.id ? 'var(--color-primary-muted)' : 'var(--color-surface)',
                      borderColor: selectedUserId === user.id ? 'var(--color-primary)' : 'var(--color-divider)',
                    }}
                  >
                    <input
                      type="radio"
                      name="userSelection"
                      checked={selectedUserId === user.id}
                      onChange={() => {
                        setSelectedUserId(user.id);
                        setDisplayName(user.displayName);
                      }}
                      className="w-5 h-5"
                    />
                    <div>
                      <div style={{ color: 'var(--color-text)', fontWeight: 500 }}>
                        {user.displayName}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Display Name (only for new user) */}
          {selectedUserId === null && (
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border transition-all"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-divider)',
                  color: 'var(--color-text)',
                }}
                placeholder="Admin User"
                disabled={loading}
              />
            </div>
          )}

          {/* Email */}
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
              disabled={loading}
            />
          </div>

          {/* Password */}
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
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-lg border transition-all"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-divider)',
                color: 'var(--color-text)',
              }}
              placeholder="Minimum 8 characters"
              disabled={loading}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Minimum 8 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text)' }}
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-lg border transition-all"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-divider)',
                color: 'var(--color-text)',
              }}
              placeholder="Re-enter password"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
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

          {/* Success Message */}
          {success && (
            <div
              className="p-4 rounded-lg border text-sm"
              style={{
                background: 'var(--color-success-muted)',
                borderColor: 'var(--color-success)',
                color: 'var(--color-success)',
              }}
            >
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Creating Admin...' : 'Create Admin Account'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p
        className="mt-8 text-sm text-center"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Kinboard · First-time setup
      </p>
    </div>
  );
}
