/**
 * useNotification - 通知模块主 composable
 *
 * 使用 @dailyuse/http-client 的 AxiosHttpClient 进行 HTTP 调用。
 */

import { computed } from 'vue';
import { useNotificationStore } from '../stores/notificationStore';
import { httpClient } from '@/shared/http';
import { HttpClientError } from '@dailyuse/http-client';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';

const BASE = '/notifications';

export function useNotification() {
  const store = useNotificationStore();

  const notifications = computed(() => store.notifications);
  const unreadCount = computed(() => store.unreadCount);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const pagination = computed(() => store.pagination);
  const hasUnread = computed(() => store.unreadCount > 0);

  function handleError(err: unknown, fallback: string): void {
    const msg = err instanceof HttpClientError ? err.message : err instanceof Error ? err.message : fallback;
    store.setError(msg);
    console.error(fallback, err);
  }

  async function fetchNotifications(query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    try {
      const res = await httpClient.get<{ data: NotificationClientDTO[]; total: number }>(BASE, {
        params: {
          ...query,
          page: store.pagination.page,
          pageSize: store.pagination.pageSize,
        },
      });
      store.setNotifications(res.data as NotificationClientDTO[], res.total);
    } catch (e) { handleError(e, '加载通知列表失败'); }
    finally { store.setLoading(false); }
  }

  async function markAsRead(id: string) {
    try {
      await httpClient.patch<unknown>(`${BASE}/${id}/read`);
      const n = store.notifications.find((x) => x.id === id);
      if (n) {
        store.updateNotification({ ...n, isRead: true, readAt: Date.now() } as NotificationClientDTO);
        store.decrementUnread();
      }
    } catch (e) { handleError(e, '标记已读失败'); }
  }

  async function markAllAsRead() {
    try {
      await httpClient.patch<void>(`${BASE}/read-all`);
      store.notifications.forEach((n) => {
        if (!n.isRead) store.updateNotification({ ...n, isRead: true, readAt: Date.now() } as NotificationClientDTO);
      });
      store.setUnreadCount(0);
    } catch (e) { handleError(e, '全部标记已读失败'); }
  }

  async function dismiss(id: string) {
    try { await httpClient.delete<void>(`${BASE}/${id}`); store.removeNotification(id); }
    catch (e) { handleError(e, '删除通知失败'); }
  }

  async function dismissAll() {
    try { await httpClient.delete<void>(`${BASE}/dismiss-all`); store.clearAll(); store.setUnreadCount(0); }
    catch (e) { handleError(e, '清空通知失败'); }
  }

  async function refreshStats() {
    try {
      const stats = await httpClient.get<{ unreadCount: number; total: number }>(`${BASE}/stats`);
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
