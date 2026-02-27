/**
 * useNotification - 通知模块主 composable
 *
 * 通过 inject 获取 NotificationClientService，所有方法返回 Result<T>。
 */

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '../stores/notificationStore';
import { NOTIFICATION_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';

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

  function handleError(message: string): void {
    store.setError(message);
    console.error(message);
  }

  async function fetchNotifications(query?: Record<string, unknown>) {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.findNotifications({
        ...query,
        page: store.pagination.page,
        limit: store.pagination.pageSize,
      } as Parameters<typeof service.findNotifications>[0]);
      if (result.ok) {
        store.setNotifications(result.data.notifications ?? [], result.data.total ?? 0);
      } else {
        handleError(result.error.message || t('notification.error.fetchFailed'));
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
      handleError(result.error.message || t('notification.error.markReadFailed'));
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
      handleError(result.error.message || t('notification.error.markAllReadFailed'));
    }
  }

  async function dismiss(id: string) {
    const result = await service.deleteNotification(id);
    if (result.ok) {
      store.removeNotification(id);
    } else {
      handleError(result.error.message || t('notification.error.deleteFailed'));
    }
  }

  async function dismissAll() {
    // TODO: NotificationClientService does not yet provide dismissAll — stub until service is extended
    console.warn('[notification] dismissAll not yet available in NotificationClientService');
  }

  async function refreshStats() {
    const result = await service.getUnreadCount();
    if (result.ok) {
      store.setUnreadCount(result.data.count ?? 0);
    } else {
      handleError(result.error.message || t('notification.error.refreshStatsFailed'));
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
