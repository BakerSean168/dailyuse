/**
 * useNotification - 通知模块主 composable
 */

import { computed } from 'vue';
import { useNotificationStore } from '../stores/notificationStore';
import { notificationApi, NotificationApiError } from '../services/notificationApi';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';

export function useNotification() {
  const store = useNotificationStore();

  const notifications = computed(() => store.notifications);
  const unreadCount = computed(() => store.unreadCount);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const pagination = computed(() => store.pagination);
  const hasUnread = computed(() => store.unreadCount > 0);

  function handleError(err: unknown, fallback: string): void {
    const msg = err instanceof NotificationApiError ? err.message : err instanceof Error ? err.message : fallback;
    store.setError(msg);
    console.error(fallback, err);
  }

  async function fetchNotifications(query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    try {
      const res = await notificationApi.query({
        ...query,
        page: store.pagination.page,
        pageSize: store.pagination.pageSize,
      });
      store.setNotifications(res.data as NotificationClientDTO[], res.total);
    } catch (e) { handleError(e, '加载通知列表失败'); }
    finally { store.setLoading(false); }
  }

  async function markAsRead(id: string) {
    try {
      await notificationApi.markAsRead(id);
      const n = store.notifications.find((x) => x.id === id);
      if (n) {
        store.updateNotification({ ...n, isRead: true, readAt: Date.now() } as NotificationClientDTO);
        store.decrementUnread();
      }
    } catch (e) { handleError(e, '标记已读失败'); }
  }

  async function markAllAsRead() {
    try {
      await notificationApi.markAllAsRead();
      store.notifications.forEach((n) => {
        if (!n.isRead) store.updateNotification({ ...n, isRead: true, readAt: Date.now() } as NotificationClientDTO);
      });
      store.setUnreadCount(0);
    } catch (e) { handleError(e, '全部标记已读失败'); }
  }

  async function dismiss(id: string) {
    try { await notificationApi.dismiss(id); store.removeNotification(id); }
    catch (e) { handleError(e, '删除通知失败'); }
  }

  async function dismissAll() {
    try { await notificationApi.dismissAll(); store.clearAll(); store.setUnreadCount(0); }
    catch (e) { handleError(e, '清空通知失败'); }
  }

  async function refreshStats() {
    try {
      const stats = await notificationApi.getStats();
      store.setUnreadCount(stats.unreadCount);
    } catch (e) { handleError(e, '刷新统计失败'); }
  }

  function setPage(p: number) { store.setPage(p); fetchNotifications(); }

  return {
    notifications, unreadCount, hasUnread, isLoading, error, pagination,
    fetchNotifications, markAsRead, markAllAsRead, dismiss, dismissAll,
    refreshStats, setPage,
  };
}
