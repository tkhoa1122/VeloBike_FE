import { NotificationType } from '../../config/constants';

export interface Notification {
  _id: string;
  userId: string;
  
  type: NotificationType;
  title: string;
  message: string;
  
  // Associated data
  data?: NotificationData;
  
  // Status
  isRead: boolean;
  readAt?: Date;
  
  // Action
  action?: NotificationAction;
  
  // UI
  icon?: string;
  color?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationData {
  // Associated entity IDs
  listingId?: string;
  orderId?: string;
  messageId?: string;
  conversationId?: string;
  reviewId?: string;
  userId?: string; // Related user
  
  // Additional context
  amount?: number;
  currency?: string;
  status?: string;
  
  // Custom data
  [key: string]: any;
}

export interface NotificationAction {
  type: 'NAVIGATE' | 'EXTERNAL_LINK' | 'CALL_API' | 'NONE';
  
  // For navigation
  screen?: string;
  params?: Record<string, any>;
  
  // For external links
  url?: string;
  
  // For API calls
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: Record<string, any>;
}

// Notification settings
export interface NotificationSettings {
  userId: string;
  
  // Push notifications
  pushEnabled: boolean;
  
  // Email notifications  
  emailEnabled: boolean;
  emailTypes: NotificationType[];
  
  // In-app notifications
  inAppEnabled: boolean;
  
  // Category settings
  categories: {
    orders: boolean;
    messages: boolean;
    listings: boolean;
    payments: boolean;
    reviews: boolean;
    marketing: boolean;
    security: boolean;
  };
  
  // Quiet hours
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
  
  updatedAt: Date;
}

// For querying notifications
export interface NotificationFilters {
  type?: NotificationType;
  isRead?: boolean;
  fromDate?: Date;
  toDate?: Date;
}

export interface NotificationSearchParams {
  filters?: NotificationFilters;
  sort?: {
    field: 'createdAt' | 'readAt';
    order: 'asc' | 'desc';
  };
  page: number;
  limit: number;
}

// Price alerts
export interface PriceAlert {
  _id: string;
  userId: string;
  
  // Search criteria
  searchCriteria: {
    brand?: string;
    type?: string;
    condition?: string;
    maxPrice?: number;
    minPrice?: number;
    location?: string;
    size?: string;
  };
  
  // Alert configuration
  alertPrice: number;
  alertEmail: boolean;
  alertPush: boolean;
  
  // Status
  isActive: boolean;
  triggeredCount: number;
  lastTriggeredAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePriceAlertData {
  searchCriteria: PriceAlert['searchCriteria'];
  alertPrice: number;
  alertEmail?: boolean;
  alertPush?: boolean;
}

// Push notification payload (for FCM/APN)
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: number;
  data?: Record<string, string>; // Must be string values for FCM
  
  // Platform specific
  android?: {
    channelId: string;
    priority: 'default' | 'high';
    sound?: string;
  };
  
  ios?: {
    sound?: string;
    badge?: number;
    threadId?: string;
  };
}

// For creating notifications (system use)
export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  action?: NotificationAction;
  
  // Delivery options
  sendPush?: boolean;
  sendEmail?: boolean;
}