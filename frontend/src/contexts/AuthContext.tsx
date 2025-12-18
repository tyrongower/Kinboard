'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthResponse, adminLogin, adminLogout, refreshAccessToken, kioskAuthenticate } from '@/lib/auth';
import { setGlobalAccessToken, setTokenRefreshCallback } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: 'admin' | 'kiosk' | null;
  user: AuthResponse['user'] | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authenticateKiosk: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'kiosk' | null>(null);
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kioskToken, setKioskToken] = useState<string | null>(null); // Store original kiosk token for re-auth

  // Update auth state from response
  const updateAuthState = useCallback((response: AuthResponse) => {
    setAccessToken(response.accessToken);
    setRole(response.role);
    setUser(response.user || null);
    // Update global access token for API calls
    setGlobalAccessToken(response.accessToken);
    // Persist access token to localStorage
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('role', response.role);
  }, []);

  // Clear auth state
  const clearAuthState = useCallback(() => {
    setAccessToken(null);
    setRole(null);
    setUser(null);
    setKioskToken(null);
    // Clear global access token
    setGlobalAccessToken(null);
    setTokenRefreshCallback(null);
    // Clear from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('role');
    localStorage.removeItem('kioskToken');
  }, []);

  // Handle token refresh on demand (called by authFetch on 401)
  const handleTokenRefresh = useCallback(async (): Promise<string | null> => {
    try {
      if (role === 'admin') {
        const response = await refreshAccessToken();
        updateAuthState(response);
        return response.accessToken;
      } else if (role === 'kiosk' && kioskToken) {
        const response = await kioskAuthenticate(kioskToken);
        updateAuthState(response);
        return response.accessToken;
      }
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthState();
      return null;
    }
  }, [role, kioskToken, updateAuthState, clearAuthState]);

  // Attempt to restore auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we have stored auth data
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRole = localStorage.getItem('role') as 'admin' | 'kiosk' | null;
        const storedKioskToken = localStorage.getItem('kioskToken');

        if (storedAccessToken && storedRole) {
          // Restore from localStorage
          setAccessToken(storedAccessToken);
          setRole(storedRole);
          setGlobalAccessToken(storedAccessToken);

          if (storedRole === 'kiosk' && storedKioskToken) {
            setKioskToken(storedKioskToken);
          }

          setIsLoading(false);
          return;
        }

        // If no stored token, try admin refresh token (HttpOnly cookie)
        const response = await refreshAccessToken();
        updateAuthState(response);
      } catch (error) {
        // No valid refresh token or stored auth, user needs to log in
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [updateAuthState, clearAuthState]);

  // Register token refresh callback with API layer
  useEffect(() => {
    if (accessToken && (role === 'admin' || (role === 'kiosk' && kioskToken))) {
      setTokenRefreshCallback(handleTokenRefresh);
    } else {
      setTokenRefreshCallback(null);
    }
  }, [accessToken, role, kioskToken, handleTokenRefresh]);

  // Auto-refresh access token before expiration (14 minutes, token expires in 15)
  useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(async () => {
      try {
        if (role === 'admin') {
          // Admin: use refresh token cookie
          const response = await refreshAccessToken();
          updateAuthState(response);
        } else if (role === 'kiosk' && kioskToken) {
          // Kiosk: re-authenticate with original token
          const response = await kioskAuthenticate(kioskToken);
          updateAuthState(response);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        clearAuthState();
      }
    }, 14 * 60 * 1000); // 14 minutes

    return () => clearInterval(interval);
  }, [accessToken, role, kioskToken, updateAuthState, clearAuthState]);

  // Admin login
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await adminLogin({ email, password });
      updateAuthState(response);
    } catch (error) {
      clearAuthState();
      throw error;
    }
  }, [updateAuthState, clearAuthState]);

  // Logout
  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        await adminLogout(accessToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthState();
    }
  }, [accessToken, clearAuthState]);

  // Kiosk authentication
  const authenticateKiosk = useCallback(async (token: string) => {
    try {
      const response = await kioskAuthenticate(token);
      updateAuthState(response);
      // Store the original kiosk token for re-authentication every 14 minutes
      setKioskToken(token);
      // Persist kiosk token to localStorage so it survives page refreshes
      localStorage.setItem('kioskToken', token);
    } catch (error) {
      clearAuthState();
      throw error;
    }
  }, [updateAuthState, clearAuthState]);

  const value: AuthContextType = {
    isAuthenticated: !!accessToken,
    isLoading,
    role,
    user,
    accessToken,
    login,
    logout,
    authenticateKiosk,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
