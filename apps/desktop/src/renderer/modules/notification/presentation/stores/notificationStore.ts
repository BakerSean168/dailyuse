/**
 * Notification Store - Zustand 状态管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NotificationType, NotificationStatus } from '@dailyuse/contracts/notification';
import { NotificationClient } from '@dailyuse/notification/domain-client';
import { notificationApplicationService } from '@dailyuse/notification/application-client';

// Re-export for backward compatibility
export type { NotificationType, NotificationStatus };
export { NotificationClient };

// ============ Types ============
export interface NotificationState {
  notifications: NotificationClient[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
}

export interface NotificationActions {
  addNotification: (notification: Pick<NotificationClient, 'title' | 'content' | 'type'>) => void;
  removeNotification: (uuid: string) => void;
  markAsRead: (uuid: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface NotificationSelectors {
  getUnreadNotifications: () => NotificationClient[];
  getNotificationById: (uuid: string) => NotificationClient | undefined;
}

type NotificationStore = NotificationState & NotificationActions & NotificationSelectors;

const initialState: NotificationState = {
  notifications: [],
  isLoading: false,
  error: null,
  unreadCount: 0,
};

// ============ Store ============
export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addNotification: (notification) => {
        // 使用 application service 创建通知 - 已返回 Entity 对象
        notificationApplicationService
          .createNotification({
            title: notification.title,
            content: notification.content,
            type: notification.type,
          })
          .then((newNotification) => {
            // application-client 已返回 Entity，无需转换
            set((state) => ({
              notifications: [newNotification, ...state.notifications],
              unreadCount: state.unreadCount + 1,
            }));
          })
          .catch((error) => {
            set({ error: error.message });
          });
      },

      removeNotification: (uuid) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.uuid === uuid);
          return {
            notifications: state.notifications.filter((n) => n.uuid !== uuid),
            unreadCount:
              notification && !notification.isRead ? state.unreadCount - 1 : state.unreadCount,
          };
        }),

      markAsRead: (uuid) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.uuid === uuid);
          if (!notification || notification.isRead) return state;

          // 调用 Entity 方法标记为已读，然后创建新数组触发更新
          notification.markAsRead();
          return {
            notifications: [...state.notifications],
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        }),

      markAllAsRead: () =>
        set((state) => {
          // 调用每个 Entity 的 markAsRead 方法
          state.notifications.forEach((n) => {
            if (!n.isRead) {
              n.markAsRead();
            }
          });
          return {
            notifications: [...state.notifications],
            unreadCount: 0,
          };
        }),

      clearAll: () => set({ notifications: [], unreadCount: 0 }),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Selectors
      getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.isRead);
      },

      getNotificationById: (uuid) => {
        return get().notifications.find((n) => n.uuid === uuid);
      },
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // 序列化 Entity 为 DTO 存储
        notifications: state.notifications.slice(0, 100).map((n) => n.toClientDTO()), // Keep last 100
        unreadCount: state.unreadCount,
      }),
      // 反序列化时将 DTO 转换回 Entity
      onRehydrateStorage: () => (state) => {
        if (state && state.notifications) {
          state.notifications = state.notifications.map((dto: any) =>
            NotificationClient.fromClientDTO(dto),
          );
        }
      },
    },
  ),
);

export const useNotifications = () => useNotificationStore((state) => state.notifications);
export const useUnreadCount = () => useNotificationStore((state) => state.unreadCount);
