/**
 * Notification Module - Public Exports
 *
 * @module modules/notification
 */

// Store
export { useNotificationStore } from './stores/notification-store';
export type { NotificationStoreType } from './stores/notification-store';

// Composables
export { useNotification } from './composables/useNotification';
export {
  useNotificationPreferences,
  NOTIFICATION_PREFERENCE_MODULES,
} from './composables/useNotificationPreferences';

// Routes
export { notificationRoutes } from './router';

// Initialization
export { createNotificationStartupHook } from './initialization';
export { createNotificationClickNavigation } from './desktop/notification-click-navigation';
// Components
export * from './components';
