// Authentication service for kiosk token flow
import axios from 'axios';
import { AuthResponse } from '../types';
import { tokenStorage } from './storage';
import { apiClient } from '../api/client';
import { getApiBaseUrl } from '../api/apiBaseUrl';
import { setAccessToken, setUnauthorizedHandler } from './authContext';

function validateApiBaseUrl(): void {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl || typeof baseUrl !== 'string') {
    throw new Error('App configuration error: API base URL is missing.');
  }
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('App configuration error: API base URL must start with http:// or https://');
    }
  } catch (e) {
    throw new Error('App configuration error: API base URL is not a valid URL.');
  }
}

function toFriendlyNetworkError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return new Error('Network timeout. Please check your connection and try again.');
    }

    if (!error.response) {
      return new Error(
        'Cannot reach the server. Check your internet connection and confirm the API base URL is reachable from this device.'
      );
    }

    const serverMessage = (error.response.data as any)?.message;
    if (typeof serverMessage === 'string' && serverMessage.trim()) {
      return new Error(serverMessage);
    }
  }

  if (error instanceof Error && error.message) return error;
  return new Error('Unexpected error. Please try again.');
}

class AuthService {
  private accessToken: string | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Allow the API client to trigger a forced logout without importing this service (avoid require cycles).
    setUnauthorizedHandler(() => this.logout());
  }

  // Authenticate with kiosk token
  async authenticateKiosk(token: string): Promise<AuthResponse> {
    validateApiBaseUrl();

    let response;
    try {
      response = await apiClient.post<AuthResponse>('/api/auth/kiosk/authenticate', { token });
    } catch (e) {
      throw toFriendlyNetworkError(e);
    }

    const accessToken = (response.data as any)?.accessToken;
    if (!accessToken || typeof accessToken !== 'string') {
      throw new Error('Authentication error: server did not return an access token.');
    }

    // Store tokens securely
    await tokenStorage.saveKioskToken(token);
    await tokenStorage.saveAccessToken(accessToken);

    this.accessToken = accessToken;
    setAccessToken(accessToken);
    this.startTokenRefresh(token);

    return response.data;
  }

  // Get current access token
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Load tokens from secure storage
  async loadStoredTokens(): Promise<boolean> {
    try {
      const kioskToken = await tokenStorage.getKioskToken();
      const accessToken = await tokenStorage.getAccessToken();

      // Validate token types loaded from storage; clear bad data instead of cascading failures
      if (kioskToken != null && typeof kioskToken !== 'string') {
        await tokenStorage.clearTokens();
        return false;
      }
      if (accessToken != null && typeof accessToken !== 'string') {
        await tokenStorage.clearTokens();
        return false;
      }

      if (typeof kioskToken === 'string' && typeof accessToken === 'string') {
        if (kioskToken.trim() && accessToken.trim()) {
          this.accessToken = accessToken;
          setAccessToken(accessToken);
          this.startTokenRefresh(kioskToken);
          return true;
        }
        await tokenStorage.clearTokens();
        return false;
      }

      return false;
    } catch (e) {
      console.error('Failed to load stored tokens', e);
      return false;
    }
  }

  // Refresh access token using kiosk token
  private async refreshAccessToken(kioskToken: string): Promise<void> {
    try {
      validateApiBaseUrl();
      const response = await apiClient.post<AuthResponse>('/api/auth/kiosk/authenticate', { token: kioskToken });

      const accessToken = (response.data as any)?.accessToken;
      if (!accessToken || typeof accessToken !== 'string') {
        throw new Error('Token refresh failed: server did not return an access token.');
      }
      await tokenStorage.saveAccessToken(accessToken);
      this.accessToken = accessToken;
      setAccessToken(accessToken);
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, clear tokens and force re-auth
      await this.logout();
      throw new Error('Token refresh failed. Please re-authenticate.');
    }
  }

  // Start automatic token refresh (every 14 minutes)
  private startTokenRefresh(kioskToken: string): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(() => {
      void this.refreshAccessToken(kioskToken).catch((e) => {
        // eslint-disable-next-line no-console
        console.error('Background token refresh error', e);
      });
    }, 14 * 60 * 1000); // 14 minutes
  }

  // Stop token refresh
  private stopTokenRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Logout (clear tokens)
  async logout(): Promise<void> {
    this.stopTokenRefresh();
    this.accessToken = null;
    setAccessToken(null);
    await tokenStorage.clearTokens();
  }
}

export const authService = new AuthService();
