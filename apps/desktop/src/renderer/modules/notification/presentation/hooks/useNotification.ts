/**
 * useNotification Hook
 *
 * 通知管理 Hook
 * Story-010: Notification Module
 * EPIC-015 重构: 使用 ApplicationService 替代 Container
 */

import { useState, useEffect, useCallback } from 'react';
import { notificationApplicationService } from '@dailyuse/application-client/notification';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';

/**
 * Query notifications request
 */
interface QueryNotificationsRequest {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
}

interface NotificationState {
  notifications: NotificationClientDTO[];
  unreadCount: number;
  total: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

export interface UseNotificationReturn extends NotificationState {
  // List operations
  loadNotifications: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;

  // Read operations
  markAsRead: (uuid: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;

  // Delete operations
  deleteNotification: (uuid: string) => Promise<void>;
  batchDelete: (uuids: string[]) => Promise<void>;

  // Filter
  setFilter: (filter: Partial<QueryNotificationsRequest>) => void;
  filter: QueryNotificationsRequest;

  // Utilities
  clearError: () => void;
}

const PAGE_SIZE = 20;

export function useNotification(): UseNotificationReturn {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    total: 0,
    loading: false,
    error: null,
    hasMore: true,
    page: 1,
  });

  const [filter, setFilterState] = useState<QueryNotificationsRequest>({
    page: 1,
    limit: PAGE_SIZE,
  });

  // Load notifications
  const loadNotifications = useCallback(
    async (reset = false) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const currentPage = reset ? 1 : state.page;

        const response = await notificationApplicationService.findNotifications({
          ...filter,
          page: currentPage,
          limit: PAGE_SIZE,
        });

        const unreadResponse = await notificationApplicationService.getUnreadCount();

        setState((prev) => ({
          ...prev,
          notifications: reset
            ? response.notifications
            : [...prev.notifications, ...response.notifications],
          total: response.total,
          hasMore: response.hasMore,
          page: currentPage,
          unreadCount: unreadResponse.count,
          loading: false,
        }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '加载通知失败';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    [filter, state.page],
  );

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return;

    setState((prev) => ({ ...prev, page: prev.page + 1 }));
    await loadNotifications(false);
  }, [state.loading, state.hasMore, loadNotifications]);

  // Refresh
  const refresh = useCallback(async () => {
    await loadNotifications(true);
  }, [loadNotifications]);

  // Mark as read
  const markAsRead = useCallback(async (uuid: string) => {
    try {
      const updated = await notificationApplicationService.markAsRead(uuid);

      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => (n.uuid === uuid ? updated : n)),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '标记已读失败';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApplicationService.markAllAsRead();

      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: Date.now(),
        })),
        unreadCount: 0,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '全部标记已读失败';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (uuid: string) => {
    try {
      await notificationApplicationService.deleteNotification(uuid);

      setState((prev) => {
        const deleted = prev.notifications.find((n) => n.uuid === uuid);
        return {
          ...prev,
          notifications: prev.notifications.filter((n) => n.uuid !== uuid),
          total: prev.total - 1,
          unreadCount: deleted && !deleted.isRead ? prev.unreadCount - 1 : prev.unreadCount,
        };
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除通知失败';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, []);

  // Batch delete
  const batchDelete = useCallback(async (uuids: string[]) => {
    try {
      await notificationApplicationService.batchDeleteNotifications(uuids);

      setState((prev) => {
        const unreadDeleted = prev.notifications.filter(
          (n) => uuids.includes(n.uuid) && !n.isRead,
        ).length;
        return {
          ...prev,
          notifications: prev.notifications.filter((n) => !uuids.includes(n.uuid)),
          total: prev.total - uuids.length,
          unreadCount: prev.unreadCount - unreadDeleted,
        };
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '批量删除失败';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, []);

  // Set filter
  const setFilter = useCallback((newFilter: Partial<QueryNotificationsRequest>) => {
    setFilterState((prev: QueryNotificationsRequest) => ({ ...prev, ...newFilter, page: 1 }));
    setState((prev) => ({ ...prev, page: 1, notifications: [], hasMore: true }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Load on mount and filter change
  useEffect(() => {
    loadNotifications(true);
  }, [filter]);

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    total: state.total,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    page: state.page,
    loadNotifications,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    batchDelete,
    setFilter,
    filter,
    clearError,
  };
}

export default useNotification;
