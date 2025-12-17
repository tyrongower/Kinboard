// Authentication API service for frontend
// Handles admin login, token refresh, kiosk authentication, and logout

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface AuthResponse {
  accessToken: string;
  role: 'admin' | 'kiosk';
  user?: {
    id: number;
    email: string;
    displayName: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface KioskAuthRequest {
  token: string;
}

/**
 * Admin login
 * Sets refresh token in HttpOnly cookie automatically
 */
export async function adminLogin(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Required for cookies
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

/**
 * Refresh access token using HttpOnly refresh token cookie
 */
export async function refreshAccessToken(): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/admin/refresh`, {
    method: 'POST',
    credentials: 'include', // Required for cookies
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  return response.json();
}

/**
 * Admin logout
 * Revokes refresh token and clears cookie
 */
export async function adminLogout(accessToken: string): Promise<void> {
  await fetch(`${API_URL}/api/auth/admin/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include', // Required for cookies
  });
}

/**
 * Kiosk authentication using token from URL
 */
export async function kioskAuthenticate(token: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/kiosk/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error('Kiosk authentication failed');
  }

  return response.json();
}

/**
 * Check authentication status
 */
export async function getAuthStatus(accessToken: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/status`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Not authenticated');
  }

  return response.json();
}
