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

// Routes
export { notificationRoutes } from './router';

// Initialization
export { registerNotificationInitializationTasks } from './initialization';
// Components
export * from './components';
