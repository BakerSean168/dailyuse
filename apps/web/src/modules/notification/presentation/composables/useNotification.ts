/**
 * useNotification - 通知模块主 composable
 *
 * 通过 inject 获取 NotificationClientService，所有方法返回 Result<T>。
 */

import { computed, inject } from 'vue';
import { useNotificationStore } from '../stores/notificationStore';
import { NOTIFICATION_SERVICE_KEY } from '@/shared/di';
import { resultHttpClient } from '@/shared/http';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';

const BASE = '/notifications';

export function useNotification() {
  const service = inject(NOTIFICATION_SERVICE_KEY)!;
  const store = useNotificationStore();

  const notifications = computed(() => store.notifications);
  const unreadCount = computed(() => store.unreadCount);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const pagination = computed(() => store.pagination);
  const hasUnread = computed(() => store.unreadCount > 0);

  function handleError(message: string): void {
    store.setError(message);
    console.error(message);
  }

  async function fetchNotifications(query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    const result = await service.findNotifications({
      ...query,
      page: store.pagination.page,
      limit: store.pagination.pageSize,
    } as Parameters<typeof service.findNotifications>[0]);
    if (result.ok) {
      store.setNotifications(result.data.notifications, result.data.total);
    } else {
      handleError(result.error.message || '加载通知列表失败');
    }
    store.setLoading(false);
  }

  async function markAsRead(id: string) {
    const result = await service.markAsRead(id);
    if (result.ok) {
      store.updateNotification(result.data);
      store.decrementUnread();
    } else {
      handleError(result.error.message || '标记已读失败');
    }
  }

  async function markAllAsRead() {
    const result = await service.markAllAsRead();
    if (result.ok) {
      store.notifications.forEach((n) => {
        if (!n.isRead) store.updateNotification({ ...n, isRead: true, readAt: Date.now() } as NotificationClientDTO);
      });
      store.setUnreadCount(0);
    } else {
      handleError(result.error.message || '全部标记已读失败');
    }
  }

  async function dismiss(id: string) {
    const result = await service.deleteNotification(id);
    if (result.ok) { store.removeNotification(id); }
    else { handleError(result.error.message || '删除通知失败'); }
  }

  async function dismissAll() {
    const result = await resultHttpClient.delete<void>(`${BASE}/dismiss-all`);
    if (result.ok) { store.clearAll(); store.setUnreadCount(0); }
    else { handleError(result.error.message || '清空通知失败'); }
  }

  async function refreshStats() {
    const result = await service.getUnreadCount();
    if (result.ok) { store.setUnreadCount(result.data.count); }
    else { handleError(result.error.message || '刷新统计失败'); }
  }

  function setPage(p: number) { store.setPage(p); fetchNotifications(); }

  return {
    notifications, unreadCount, hasUnread, isLoading, error, pagination,
    fetchNotifications, markAsRead, markAllAsRead, dismiss, dismissAll,
    refreshStats, setPage,
  };
}
