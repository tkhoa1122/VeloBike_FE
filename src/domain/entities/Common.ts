/**
 * Common entities and shared types across the application
 */

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: ValidationError[];
}

// Paginated response
export interface PaginatedResponse<T = any> {
  success: boolean;
  count?: number;
  page?: number;
  currentPage?: number;
  totalPages?: number;
  data?: T[];
  message?: string;
  error?: string;
}

// Validation error
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

// File upload
export interface FileUpload {
  file: File | string; // File object or base64
  filename: string;
  mimeType: string;
  size: number;
}

export interface UploadResponse {
  url: string;
  publicId: string;
  filename: string;
  size: number;
  mimeType: string;
}

// Coordinates
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number; // meters
  address?: string;
}

// Time range
export interface TimeRange {
  start: Date;
  end: Date;
}

// Price range
export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

// Sort options
export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

// Search parameters (generic)
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: SortOptions;
  page: number;
  limit: number;
}

// Error types
export type ErrorType = 
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'PERMISSION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'SERVER_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR'
  ;

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Form states
export interface FormState<T = any> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

// Cache entry
export interface CacheEntry<T = any> {
  data: T;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
}

// Device info
export interface DeviceInfo {
  id: string;
  platform: 'ios' | 'android' | 'web';
  version: string;
  model?: string;
  pushToken?: string;
}

// App settings
export interface AppSettings {
  language: string;
  currency: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    push: boolean;
    email: boolean;
    marketing: boolean;
  };
  location: {
    enabled: boolean;
    accuracy: 'high' | 'low';
  };
  privacy: {
    analytics: boolean;
    crashReporting: boolean;
    personalizedAds: boolean;
  };
}

// Feature flags
export interface FeatureFlags {
  chatbot: boolean;
  videoChat: boolean;
  liveStreaming: boolean;
  socialLogin: boolean;
  biometricAuth: boolean;
  paymentInstallment: boolean;
  inspectionAR: boolean;
  listingBoost: boolean;
}

// Analytics events
export interface AnalyticsEvent {
  name: string;
  params: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

// Real-time event
export interface RealtimeEvent {
  type: string;
  payload: any;
  timestamp: Date;
  userId?: string;
}

// Statistics (generic)
export interface Statistics {
  period: 'day' | 'week' | 'month' | 'year' | 'all';
  startDate: Date;
  endDate: Date;
  metrics: Record<string, number>;
}

// Health check
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: Record<string, {
    status: 'up' | 'down';
    latency?: number;
    error?: string;
  }>;
}

// Subscription/Plan info
export interface SubscriptionPlan {
  name: string;
  displayName: string;
  price: number;
  currency: string;
  duration: number; // days
  commissionRate: number;
  maxListingsPerMonth: number;
  features: string[];
  badge?: {
    text: string;
    color: string;
  };
}

export interface UserSubscription {
  plan: SubscriptionPlan;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  autoRenew: boolean;
  usage: {
    listingsThisMonth: number;
    salesThisMonth: number;
    revenueThisMonth: number;
  };
}