// Axios client with authentication interceptor
import axios, { AxiosInstance } from 'axios';
import { getAccessToken, handleUnauthorized } from '../auth/authContext';
import { getApiBaseUrl } from './apiBaseUrl';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      throw new Error('API server is not configured. Please set the server URL and try again.');
    }
    config.baseURL = baseUrl;

    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - force re-auth
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);
