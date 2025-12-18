// API base URL configuration stored at runtime (first logon / device-specific)
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL_KEY = 'api_base_url';

const isWeb = Platform.OS === 'web';

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

const storage = isWeb ? webStorage : SecureStore;

let apiBaseUrlCache: string | null = null;
let loaded = false;

function normalizeBaseUrl(value: string): string {
  // Avoid accidental double slashes when axios joins `baseURL` + path
  return value.trim().replace(/\/+$/, '');
}

export function getApiBaseUrl(): string | null {
  return apiBaseUrlCache;
}

export async function loadApiBaseUrl(): Promise<string | null> {
  if (loaded) return apiBaseUrlCache;
  loaded = true;

  try {
    const stored = await storage.getItemAsync(API_BASE_URL_KEY);
    if (typeof stored === 'string' && stored.trim()) {
      apiBaseUrlCache = normalizeBaseUrl(stored);
    } else {
      apiBaseUrlCache = null;
    }
  } catch (e) {
    console.error('Failed to read API base URL from storage', e);
    apiBaseUrlCache = null;
  }

  return apiBaseUrlCache;
}

export async function clearApiBaseUrl(): Promise<void> {
  apiBaseUrlCache = null;
  loaded = true;
  try {
    await storage.deleteItemAsync(API_BASE_URL_KEY);
  } catch (e) {
    console.error('Failed to clear API base URL from storage', e);
  }
}

export function getApiBaseUrlWarning(baseUrl: unknown): string | null {
  if (typeof baseUrl !== 'string' || !baseUrl.trim()) return 'API server URL is missing.';

  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return 'API server URL is not a valid URL.';
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'API server URL must start with http:// or https://';
  }

  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    return 'API server URL points to localhost. This works on web, but will fail on a physical device. Use a LAN IP or a reachable hostname.';
  }

  return null;
}

export async function setApiBaseUrl(baseUrl: string): Promise<void> {
  const normalized = normalizeBaseUrl(baseUrl);
  const warning = getApiBaseUrlWarning(normalized);
  if (warning) {
    throw new Error(warning);
  }

  try {
    await storage.setItemAsync(API_BASE_URL_KEY, normalized);
  } catch (e) {
    console.error('Failed to save API base URL to storage', e);
    throw e;
  }

  apiBaseUrlCache = normalized;
  loaded = true;
}
