import { API_CONFIG } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Base API Client with common functionality
 */
export class BaseApiClient {
  protected baseURL: string;
  protected timeout: number;

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

    // Add authorization header if token exists
    const token = await this.getStoredToken();
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
      // Don't set Content-Type for FormData - browser will set it with boundary
    };

    const token = await this.getStoredToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Get stored auth token
   */
  protected async getStoredToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      return token;
    } catch (error) {
      console.warn('Error getting stored token:', error);
      return null;
    }
  }

  /**
   * Store auth token
   */
  protected async setStoredToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.warn('Error storing token:', error);
    }
  }

  /**
   * Clear auth token
   */
  protected async clearStoredToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.warn('Error clearing token:', error);
    }
  }

  /**
   * Make HTTP request with error handling
   */
  protected async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
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

      // Handle different response types
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
   * Handle error responses
   */
  protected async handleErrorResponse(response: Response): Promise<void> {
    let errorMessage = 'Network error occurred';
    let errorDetails = null;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      errorDetails = errorData.errors || null;
    } catch {
      // If can't parse JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    // Handle specific status codes
    switch (response.status) {
      case 401:
        // Unauthorized - clear token and redirect
        await this.clearStoredToken();
        errorMessage = 'Phiên đăng nhập đã hết hạn';
        break;
      case 403:
        errorMessage = 'Bạn không có quyền thực hiện thao tác này';
        break;
      case 404:
        errorMessage = 'Không tìm thấy tài nguyên yêu cầu';
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