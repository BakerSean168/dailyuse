/**
 * Notification Module - Public Exports
 *
 * @module modules/notification
 */

// Store (UI state only: page/pageSize/readFilter; server state lives in the query cache)
export { useNotificationStore } from './stores/notification-store';
export type { NotificationStoreType, NotificationReadFilter } from './stores/notification-store';

// Composables (Query Cache authority pilot)
export {
  useNotificationListQuery,
  useNotificationUnreadQuery,
  useNotificationMutations,
  type UseNotificationListQueryOptions,
} from './composables';
export {
  useNotificationPreferences,
  NOTIFICATION_PREFERENCE_MODULES,
} from './composables/useNotificationPreferences';

// Routes
export { notificationRoutes } from './router';

// Initialization (event sources → dispatcher only; Step 3)
export {
  createNotificationStartupHook,
  type NotificationStartupHookOptions,
} from './initialization';
export {
  createNotificationSseInvalidationSource,
  type NotificationSseInvalidationSourceOptions,
  type NotificationSseCursorStore,
} from './initialization/notification-sse-invalidation-source';
export { createNotificationClickNavigation } from './desktop/notification-click-navigation';
// Components
export * from './components';
