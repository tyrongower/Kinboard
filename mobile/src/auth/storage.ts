// Secure token storage using expo-secure-store (native) or localStorage (web)
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KIOSK_TOKEN_KEY = 'kiosk_token';
const ACCESS_TOKEN_KEY = 'access_token';

// Check if we're on web platform
const isWeb = Platform.OS === 'web';

// Web storage fallback using localStorage
const webStorage = {
  async setItemAsync(key: string, value: string): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  async getItemAsync(key: string): Promise<string | null> {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  async deleteItemAsync(key: string): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

// Use appropriate storage based on platform
const storage = isWeb ? webStorage : SecureStore;

export const tokenStorage = {
  // Save kiosk token (original token from URL)
  async saveKioskToken(token: string): Promise<void> {
    try {
      await storage.setItemAsync(KIOSK_TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to save kiosk token to secure storage', e);
      throw e;
    }
  },

  // Get kiosk token
  async getKioskToken(): Promise<string | null> {
    try {
      return await storage.getItemAsync(KIOSK_TOKEN_KEY);
    } catch (e) {
      console.error('Failed to read kiosk token from secure storage', e);
      return null;
    }
  },

  // Save access token (JWT)
  async saveAccessToken(token: string): Promise<void> {
    try {
      await storage.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to save access token to secure storage', e);
      throw e;
    }
  },

  // Get access token
  async getAccessToken(): Promise<string | null> {
    try {
      return await storage.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (e) {
      console.error('Failed to read access token from secure storage', e);
      return null;
    }
  },

  // Clear all tokens
  async clearTokens(): Promise<void> {
    try {
      await storage.deleteItemAsync(KIOSK_TOKEN_KEY);
      await storage.deleteItemAsync(ACCESS_TOKEN_KEY);
    } catch (e) {
      console.error('Failed to clear tokens from secure storage', e);
      // Do not rethrow: logout should be best-effort
    }
  },
};
