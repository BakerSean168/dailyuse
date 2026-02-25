/**
 * Notification Module - Public Exports
 *
 * @module modules/notification
 */

// Store
export { useNotificationStore } from './stores/notificationStore';
export type { NotificationStoreType } from './stores/notificationStore';

// Composables
export { useNotification } from './composables/useNotification';

// Routes
export { notificationRoutes } from './router';
