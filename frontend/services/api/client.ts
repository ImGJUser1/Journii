// services/api/client.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as Network from 'expo-network';
import { onlineManager, focusManager } from '@tanstack/react-query';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'https://api.journii.app/v1';

// Network state management for React Query
onlineManager.setEventListener((setOnline) => {
  const subscription = Network.addNetworkStateListener((state) => {
    setOnline(!!state.isConnected);
  });
  return () => subscription.remove();
});

// Refocus handling
focusManager.setEventListener((setFocused) => {
  const subscription = Platform.OS === 'web' 
    ? window.addEventListener('visibilitychange', () => setFocused(!document.hidden))
    : null;
  return () => subscription?.remove();
});

interface QueuedRequest {
  resolve: (value: string | null) => void;
  reject: (reason?: any) => void;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing: boolean = false;
  private failedQueue: QueuedRequest[] = [];
  private readonly maxRetries: number = 3;
  private retryCount: Map<string, number> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Version': Constants.expoConfig?.version || '1.0.0',
        'X-Platform': Platform.OS,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request timestamp for debugging
        config.headers['X-Request-Start'] = Date.now().toString();
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log slow requests in development
        const startTime = parseInt(response.config.headers['X-Request-Start'] || '0');
        const duration = Date.now() - startTime;
        if (duration > 5000) {
          console.warn(`Slow request: ${response.config.url} took ${duration}ms`);
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

        if (!originalRequest) return Promise.reject(error);

        // Handle network errors with retry
        if (!error.response) {
          const retryKey = `${originalRequest.method}-${originalRequest.url}`;
          const currentRetry = this.retryCount.get(retryKey) || 0;
          
          if (currentRetry < this.maxRetries) {
            this.retryCount.set(retryKey, currentRetry + 1);
            await this.delay(1000 * (currentRetry + 1)); // Exponential backoff
            return this.client(originalRequest);
          }
          this.retryCount.delete(retryKey);
          return Promise.reject(new Error('Network error - please check your connection'));
        }

        // Handle 401 with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }).catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            await this.logout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle 429 Rate Limit
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
          console.warn(`Rate limited. Retry after ${retryAfter}s`);
          // Could implement automatic retry here
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    if (!refreshToken) throw new Error('No refresh token available');

    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token } = response.data;
      
      await SecureStore.setItemAsync('access_token', access_token);
      if (refresh_token) {
        await SecureStore.setItemAsync('refresh_token', refresh_token);
      }

      return access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  private async logout() {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    // Emit event for auth store to handle navigation
    // This would use an event emitter in production
  }

  private normalizeError(error: AxiosError): Error {
    if (error.response?.data) {
      const data = error.response.data as any;
      const message = data.detail || data.message || error.message;
      const normalizedError = new Error(message);
      (normalizedError as any).statusCode = error.response.status;
      (normalizedError as any).errorCode = data.error_code;
      (normalizedError as any).extraData = data.extra_data;
      (normalizedError as any).isApiError = true;
      return normalizedError;
    }
    return error;
  }

  // Public API methods with type safety
  get<T>(url: string, params?: any, config?: any) {
    return this.client.get<T>(url, { params, ...config });
  }

  post<T>(url: string, data?: any, config?: any) {
    return this.client.post<T>(url, data, config);
  }

  put<T>(url: string, data?: any, config?: any) {
    return this.client.put<T>(url, data, config);
  }

  patch<T>(url: string, data?: any, config?: any) {
    return this.client.patch<T>(url, data, config);
  }

  delete<T>(url: string, config?: any) {
    return this.client.delete<T>(url, config);
  }

  // File upload with progress tracking
  uploadFile(url: string, file: FormData, onProgress?: (progress: number) => void, cancelToken?: any) {
    return this.client.post(url, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
      cancelToken,
    });
  }
}

export const apiClient = new ApiClient();