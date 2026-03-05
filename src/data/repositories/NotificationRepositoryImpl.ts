import { NotificationApiClient, NotificationResponseModel } from '../apis/NotificationApiClient';
import { Notification } from '../../domain/entities/Notification';
import { ApiResponse } from '../../domain/entities/Common';

export class NotificationRepositoryImpl {
  constructor(private notificationApiClient: NotificationApiClient) {}

  async getNotifications(params?: {
    page?: number;
    limit?: number;
    type?: string;
    isRead?: boolean;
  }): Promise<{ success: boolean; data: Notification[]; unreadCount: number }> {
    try {
      const response = await this.notificationApiClient.getNotifications(params);
      if (response.success) {
        const items = response.data.map(n => this.mapToEntity(n));
        return { success: true, data: items, unreadCount: response.unreadCount };
      }
      return { success: false, data: [], unreadCount: 0 };
    } catch {
      return { success: false, data: [], unreadCount: 0 };
    }
  }

  async markAsRead(notificationId: string): Promise<ApiResponse> {
    try {
      return await this.notificationApiClient.markAsRead(notificationId);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to mark as read' };
    }
  }

  async markAllAsRead(): Promise<ApiResponse> {
    try {
      return await this.notificationApiClient.markAllAsRead();
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to mark all as read' };
    }
  }

  private mapToEntity(model: NotificationResponseModel): Notification {
    return {
      _id: model._id,
      userId: model.userId,
      type: model.type as any,
      title: model.title,
      message: model.message,
      data: model.data,
      isRead: model.isRead,
      createdAt: new Date(model.createdAt),
      updatedAt: model.updatedAt ? new Date(model.updatedAt) : new Date(model.createdAt),
    };
  }
}
