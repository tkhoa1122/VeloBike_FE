import { API_CONFIG, ENDPOINTS } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

/**
 * Base API Client with common functionality
 * Supports dual token (accessToken + refreshToken) and auto-refresh on 401
 */
export class BaseApiClient {
  protected baseURL: string;
  protected timeout: number;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Get auth headers
   */
  protected async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const token = await this.getStoredAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Get headers for file upload
   */
  protected async getUploadHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      // Don't set Content-Type for FormData - RN will set it with boundary
    };

    const token = await this.getStoredAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // =========================================================================
  // TOKEN MANAGEMENT - Dual token (accessToken + refreshToken)
  // =========================================================================

  /**
   * Get stored access token
   */
  async getStoredAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.warn('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get stored refresh token
   */
  async getStoredRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.warn('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Store both tokens after login/refresh
   */
  async setStoredTokens(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
    } catch (error) {
      console.warn('Error storing tokens:', error);
    }
  }

  /**
   * Clear all stored tokens (logout)
   */
  async clearStoredTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);
    } catch (error) {
      console.warn('Error clearing tokens:', error);
    }
  }

  // Legacy aliases for backward compatibility
  protected async getStoredToken(): Promise<string | null> {
    return this.getStoredAccessToken();
  }

  protected async setStoredToken(token: string): Promise<void> {
    await this.setStoredTokens(token);
  }

  protected async clearStoredToken(): Promise<void> {
    await this.clearStoredTokens();
  }

  // =========================================================================
  // AUTO-REFRESH TOKEN LOGIC
  // =========================================================================

  /**
   * Attempt to refresh the access token using the stored refresh token.
   * Uses a single-flight pattern to prevent multiple concurrent refresh calls.
   */
  private async attemptTokenRefresh(): Promise<boolean> {
    // If already refreshing, wait for the existing refresh to complete
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._doRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async _doRefresh(): Promise<boolean> {
    try {
      const refreshToken = await this.getStoredRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const url = `${this.baseURL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (data.success && data.accessToken) {
        await this.setStoredTokens(data.accessToken);
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Token refresh failed:', error);
      return false;
    }
  }

  // =========================================================================
  // HTTP REQUEST WITH AUTO-REFRESH
  // =========================================================================

  /**
   * Make HTTP request with error handling and auto-refresh on 401
   */
  protected async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    _isRetry: boolean = false
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders();

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401: try refresh token before failing
      if (response.status === 401 && !_isRetry) {
        const refreshed = await this.attemptTokenRefresh();
        if (refreshed) {
          // Retry the original request with new token
          return this.request<T>(endpoint, options, true);
        }
        // Refresh failed → clear tokens and throw
        await this.clearStoredTokens();
        const error = new Error('Phiên đăng nhập đã hết hạn');
        (error as any).status = 401;
        throw error;
      }

      // Handle other error responses
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Try to parse as JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      // Return empty object for non-JSON responses
      return {} as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
      }
      
      throw error;
    }
  }

  /**
   * Handle error responses (non-401, since 401 is handled in request())
   */
  protected async handleErrorResponse(response: Response): Promise<void> {
    let errorMessage = 'Network error occurred';
    let errorDetails = null;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      errorDetails = errorData.errors || null;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    switch (response.status) {
      case 403:
        errorMessage = errorMessage || 'Bạn không có quyền thực hiện thao tác này';
        break;
      case 404:
        errorMessage = errorMessage || 'Không tìm thấy tài nguyên yêu cầu';
        break;
      case 409:
        errorMessage = errorMessage || 'Dữ liệu bị trùng lặp';
        break;
      case 422:
        errorMessage = errorMessage || 'Dữ liệu không hợp lệ';
        break;
      case 429:
        errorMessage = 'Quá nhiều yêu cầu, vui lòng thử lại sau';
        break;
      case 500:
      case 502:
      case 503:
        errorMessage = 'Lỗi máy chủ, vui lòng thử lại sau';
        break;
    }

    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).details = errorDetails;
    
    throw error;
  }

  /**
   * GET request
   */
  protected async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
      
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  protected async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  protected async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  protected async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload file
   */
  protected async upload<T = any>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getUploadHeaders();

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return await response.json();
  }
}