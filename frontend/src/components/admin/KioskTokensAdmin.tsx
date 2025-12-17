'use client';

import { useEffect, useState } from 'react';
import { kioskTokenApi, KioskToken, KioskTokenResponse } from '@/lib/api';

interface KioskTokenWithUrl {
  id: number;
  name: string;
  createdAt: string;
  token: string;
  url: string;
}

export default function KioskTokensAdmin() {
  const [tokens, setTokens] = useState<KioskToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [createdToken, setCreatedToken] = useState<KioskTokenWithUrl | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await kioskTokenApi.getAll();
      setTokens(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setTokenName('');
    setCreatedToken(null);
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setCreatedToken(null);
  };

  const createToken = async () => {
    if (!tokenName.trim()) {
      setError('Token name is required');
      return;
    }

    try {
      const data = await kioskTokenApi.create(tokenName);
      const kioskUrl = `${window.location.origin}/kiosk/auth?token=${data.token}`;

      setCreatedToken({
        ...data,
        url: kioskUrl,
      });

      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to create token');
    }
  };

  const revokeToken = async (id: number, name: string) => {
    if (!confirm(`Revoke kiosk token "${name}"? This will immediately invalidate the token.`)) return;

    try {
      await kioskTokenApi.revoke(id);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to revoke token');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div>
      {/* Section Header */}
      <div className="section-header">
        <h2 className="section-title">Kiosk Tokens</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          <span>+ New Token</span>
        </button>
      </div>

      <p className="mb-4" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
        Generate access tokens for kiosk devices. Share the URL with a device to grant access.
      </p>

      {/* Error Message */}
      {error && (
        <div
          className="mb-4 p-3 rounded-lg"
          style={{ background: 'var(--color-error-muted)', color: 'var(--color-error)' }}
        >
          {error}
        </div>
      )}

      {/* Tokens List */}
      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.id}>
                <td style={{ color: 'var(--color-text)' }}>{token.name}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>
                  {new Date(token.createdAt).toLocaleDateString()}
                </td>
                <td>
                  {token.isActive ? (
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        background: 'var(--color-success-muted)',
                        color: 'var(--color-success)'
                      }}
                    >
                      Active
                    </span>
                  ) : (
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        background: 'var(--color-error-muted)',
                        color: 'var(--color-error)'
                      }}
                    >
                      Revoked
                    </span>
                  )}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    {token.isActive && (
                      <button
                        className="btn btn-secondary text-sm"
                        onClick={() => revokeToken(token.id, token.name)}
                        style={{ minHeight: '36px' }}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && tokens.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🔑</div>
                    <p>No kiosk tokens yet</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Token Dialog */}
      {open && (
        <div className="dialog-overlay" onClick={closeDialog}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3 className="dialog-title">
                {createdToken ? 'Kiosk Token Created' : 'Create Kiosk Token'}
              </h3>
            </div>
            <div className="dialog-content">
              {!createdToken ? (
                <div className="form-group">
                  <label className="label">Token Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="Living Room Tablet"
                    autoFocus
                  />
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    Give this token a descriptive name to identify the device
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div
                    className="p-4 rounded-lg"
                    style={{ background: 'var(--color-success-muted)', borderColor: 'var(--color-success)' }}
                  >
                    <p style={{ color: 'var(--color-success)', fontWeight: 500, marginBottom: '0.5rem' }}>
                      Token created successfully!
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                      Share this URL with the kiosk device. This is the only time you'll see the full URL.
                    </p>
                  </div>

                  <div>
                    <label className="label">Kiosk URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input flex-1"
                        value={createdToken.url}
                        readOnly
                        style={{ fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}
                      />
                      <button
                        className="btn btn-secondary"
                        onClick={() => copyToClipboard(createdToken.url!)}
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label">Token</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input flex-1"
                        value={createdToken.token}
                        readOnly
                        style={{ fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}
                      />
                      <button
                        className="btn btn-secondary"
                        onClick={() => copyToClipboard(createdToken.token!)}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="dialog-footer">
              {!createdToken ? (
                <>
                  <button className="btn btn-secondary" onClick={closeDialog}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={createToken}
                    disabled={!tokenName.trim()}
                  >
                    Create Token
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={closeDialog}>
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
