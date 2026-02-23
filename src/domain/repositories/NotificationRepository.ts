import { 
  Notification, 
  NotificationSettings,
  CreateNotificationData,
  NotificationSearchParams,
  PriceAlert,
  CreatePriceAlertData 
} from '../entities/Notification';
import { ApiResponse, PaginatedResponse } from '../entities/Common';

export interface NotificationRepository {
  // Notification management
  getNotifications(params?: NotificationSearchParams): Promise<PaginatedResponse<Notification>>;
  markAsRead(notificationId: string): Promise<ApiResponse>;
  markAllAsRead(): Promise<ApiResponse>;
  deleteNotification(notificationId: string): Promise<ApiResponse>;
  
  // Settings
  getNotificationSettings(): Promise<ApiResponse<NotificationSettings>>;
  updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<ApiResponse<NotificationSettings>>;
  
  // Price alerts
  createPriceAlert(data: CreatePriceAlertData): Promise<ApiResponse<PriceAlert>>;
  getPriceAlerts(): Promise<ApiResponse<PriceAlert[]>>;
  updatePriceAlert(alertId: string, data: Partial<CreatePriceAlertData>): Promise<ApiResponse<PriceAlert>>;
  deletePriceAlert(alertId: string): Promise<ApiResponse>;
  
  // Push notifications
  registerPushToken(token: string): Promise<ApiResponse>;
  unregisterPushToken(): Promise<ApiResponse>;
  
  // Email notifications
  subscribeToNewsletter(): Promise<ApiResponse>;
  unsubscribeFromNewsletter(): Promise<ApiResponse>;
}