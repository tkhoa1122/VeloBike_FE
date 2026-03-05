import { create } from 'zustand';
import { Notification } from '../../domain/entities/Notification';
import { LoadingState } from '../../domain/entities/Common';
import { container } from '../../di/Container';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loadingState: LoadingState;
  error: string | null;

  // Actions
  getNotifications: (params?: { page?: number; limit?: number; type?: string }) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loadingState: 'idle',
  error: null,

  getNotifications: async (params?): Promise<void> => {
    set({ loadingState: 'loading', error: null });
    try {
      const repo = container().notificationRepository;
      const result = await repo.getNotifications(params);
      if (result.success) {
        set({
          notifications: result.data,
          unreadCount: result.unreadCount,
          loadingState: 'success',
        });
      } else {
        set({ loadingState: 'error', error: 'Không thể tải thông báo' });
      }
    } catch (error) {
      set({ loadingState: 'error', error: error instanceof Error ? error.message : 'Lỗi tải thông báo' });
    }
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      const repo = container().notificationRepository;
      const result = await repo.markAsRead(notificationId);
      if (result.success) {
        set(s => ({
          notifications: s.notifications.map(n =>
            n._id === notificationId ? { ...n, isRead: true } : n,
          ),
          unreadCount: Math.max(0, s.unreadCount - 1),
        }));
      }
    } catch {
      // silent fail
    }
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      const repo = container().notificationRepository;
      const result = await repo.markAllAsRead();
      if (result.success) {
        set(s => ({
          notifications: s.notifications.map(n => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
      }
    } catch {
      // silent fail
    }
  },

  clearError: () => set({ error: null }),
}));

// Selectors
export const useNotifications = () => useNotificationStore(s => s.notifications);
export const useUnreadCount = () => useNotificationStore(s => s.unreadCount);
export const useNotificationLoading = () => useNotificationStore(s => s.loadingState === 'loading');
