/**
 * Notification Store - Pinia 状态管理
 * 纯状态容器 — API 调用由 composables 执行。
 */

import { defineStore } from 'pinia';
import type { NotificationClientDTO } from '@memoflow/contracts/notification';

export interface NotificationState {
  notifications: NotificationClientDTO[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  pagination: { page: number; pageSize: number; total: number };
  isInitialized: boolean;
}

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    notifications: [],
    isLoading: false,
    error: null,
    unreadCount: 0,
    pagination: { page: 1, pageSize: 20, total: 0 },
    isInitialized: false,
  }),

  actions: {
    setNotifications(items: NotificationClientDTO[], total?: number) {
      this.notifications = items;
      if (total !== undefined) this.pagination.total = total;
    },
    addNotification(n: NotificationClientDTO) { this.notifications.unshift(n); },
    updateNotification(n: NotificationClientDTO) {
      const idx = this.notifications.findIndex((x) => x.id === n.id);
      if (idx >= 0) this.notifications[idx] = n;
    },
    removeNotification(id: string) {
      this.notifications = this.notifications.filter((n) => n.id !== id);
    },
    clearAll() { this.notifications = []; },

    setUnreadCount(c: number) { this.unreadCount = c; },
    incrementUnread() { this.unreadCount++; },
    decrementUnread() { if (this.unreadCount > 0) this.unreadCount--; },

    setLoading(v: boolean) { this.isLoading = v; },
    setError(e: string | null) { this.error = e; },
    setPage(p: number) { this.pagination.page = p; },
    setInitialized(v: boolean) { this.isInitialized = v; },

    reset() { this.$reset(); },
  },

  persist: {
    pick: ['pagination'] as string[],
  },
});

export type NotificationStoreType = ReturnType<typeof useNotificationStore>;
