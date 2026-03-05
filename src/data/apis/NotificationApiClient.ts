import { BaseApiClient } from './BaseApiClient';
import { ENDPOINTS } from '../../config/api';

// Response models
export interface NotificationResponseModel {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationListResponseModel {
  success: boolean;
  data: NotificationResponseModel[];
  unreadCount: number;
  message?: string;
}

export class NotificationApiClient extends BaseApiClient {
  /**
   * Get notifications
   */
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    type?: string;
    isRead?: boolean;
  }): Promise<NotificationListResponseModel> {
    return this.get(ENDPOINTS.NOTIFICATIONS.LIST, params);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean; message: string }> {
    return this.put(ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId));
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    return this.put(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  }
}
