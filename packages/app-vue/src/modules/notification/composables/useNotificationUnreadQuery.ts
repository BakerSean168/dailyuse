/**
 * useNotificationUnreadQuery — shared, identity-scoped unread-count query.
 *
 * 未读数是一个 server fact，只应存在一份 Query Cache 数据；页面、胶囊与 Shell 都订阅
 * 同一个 `unread` key，相同 key 的并发 consumer 共享一次 request（§2.2 gate）。
 */
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { NOTIFICATION_SERVICE_KEY } from '../../../di/keys';
import { useServerStateIdentityScope } from '../../../platform/server-state';
import { notificationQueryKeys } from '../../../platform/server-state/query-keys';
import { NOTIFICATION_STALE_TIME_MS } from '../../../platform/server-state/query-policy';
import { resultQueryFn } from '../../../platform/server-state/result-query';
import { translateResultError } from '../../../shared/utils/translate-result-error';

/**
 * Create the shared, identity-scoped Notification unread-count query.
 * 创建共享的 identity-scoped 通知未读数查询。
 */
export function useNotificationUnreadQuery() {
  const service = useStrictInject(NOTIFICATION_SERVICE_KEY, 'NotificationService');
  const resolveIdentityScope = useServerStateIdentityScope();
  const { t } = useI18n();

  const query = useQuery(() => ({
    queryKey: notificationQueryKeys.unread(resolveIdentityScope()),
    queryFn: () => resultQueryFn(() => service.getUnreadCount())(),
    staleTime: NOTIFICATION_STALE_TIME_MS,
  }));

  const unreadCount = computed(() => query.data.value?.count ?? 0);
  const hasUnread = computed(() => unreadCount.value > 0);
  const isLoading = computed(() => query.isPending.value);
  const isError = computed(() => query.isError.value);
  const error = computed(() =>
    query.error.value
      ? translateResultError(query.error.value, t, {
          fallbackKey: 'notification.error.refreshStatsFailed',
        })
      : null,
  );

  return {
    query,
    unreadCount,
    hasUnread,
    isLoading,
    isError,
    error,
    refetch: query.refetch,
  };
}
