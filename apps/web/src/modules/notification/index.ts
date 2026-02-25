/**
 * Notification Web Module
 * Re-exports from shared app-vue package + web-specific initialization
 */

// Store, Composables from app-vue
export {
  useNotificationStore,
  type NotificationStoreType,
  useNotification,
  notificationRoutes,
} from '@dailyuse/app-vue';

// Initialization (web-specific)
export { registerNotificationInitializationTasks } from './initialization/notificationInitialization';
