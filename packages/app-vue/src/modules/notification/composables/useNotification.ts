/**
 * useNotification - 通知模块主 composable
 *
 * 通过 inject 获取 NotificationClientService，所有方法返回 Result<T>。
 */

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '../stores/notification-store';
import { NOTIFICATION_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import { translateResultError } from '../../../shared/utils/translate-result-error';

export function useNotification() {
  const service = useStrictInject(NOTIFICATION_SERVICE_KEY, 'NotificationService');
  const store = useNotificationStore();
  const { t } = useI18n();

  const notifications = computed(() => store.notifications);
  const unreadCount = computed(() => store.unreadCount);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const pagination = computed(() => store.pagination);
  const hasUnread = computed(() => store.unreadCount > 0);

  function handleError(error: unknown, fallbackKey: string): void {
    const message = translateResultError(error, t, { fallbackKey });
    store.setError(message);
    console.error(message);
  }

  async function fetchNotifications(query?: Record<string, unknown>) {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.findNotifications(
        sanitizeForIpc({
          ...query,
          page: store.pagination.page,
          limit: store.pagination.pageSize,
        }) as Parameters<typeof service.findNotifications>[0],
      );
      if (result.ok) {
        store.setNotifications(result.data.notifications ?? [], result.data.total ?? 0);
      } else {
        handleError(result.error, 'notification.error.fetchFailed');
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    const result = await service.markAsRead(id);
    if (result.ok) {
      store.updateNotification(result.data);
      store.decrementUnread();
    } else {
      handleError(result.error, 'notification.error.markReadFailed');
    }
  }

  async function markAllAsRead() {
    const result = await service.markAllAsRead();
    if (result.ok) {
      [...store.notifications].forEach((n) => {
        if (!n.isRead)
          store.updateNotification({
            ...n,
            isRead: true,
            readAt: Date.now(),
          } as NotificationClientDTO);
      });
      store.setUnreadCount(0);
    } else {
      handleError(result.error, 'notification.error.markAllReadFailed');
    }
  }

  async function dismiss(id: string) {
    const result = await service.deleteNotification(id);
    if (result.ok) {
      store.removeNotification(id);
    } else {
      handleError(result.error, 'notification.error.deleteFailed');
    }
  }

  async function dismissAll() {
    const ids = store.notifications.map((notification) => notification.id);
    if (ids.length === 0) {
      return;
    }

    const result = await service.dismissAll(ids);
    if (result.ok) {
      store.setNotifications([], 0);
      store.setUnreadCount(0);
    } else {
      handleError(result.error, 'notification.error.deleteFailed');
    }
  }

  async function refreshStats() {
    const result = await service.getUnreadCount();
    if (result.ok) {
      store.setUnreadCount(result.data.count ?? 0);
    } else {
      handleError(result.error, 'notification.error.refreshStatsFailed');
    }
  }

  function setPage(p: number) {
    store.setPage(p);
    fetchNotifications();
  }

  return {
    notifications,
    unreadCount,
    hasUnread,
    isLoading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
    refreshStats,
    setPage,
  };
}
