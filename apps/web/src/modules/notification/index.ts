/**
 * Notification 模块入口
 */

// ===== Presentation Layer =====
export { useNotificationStore } from './presentation/stores/notificationStore';
export type { NotificationStoreType } from './presentation/stores/notificationStore';
export { useNotification } from './presentation/composables/useNotification';

// UI 组件
export { default as InAppNotification } from './presentation/components/InAppNotification.vue';
export { default as NotificationPermissionWarning } from './presentation/components/NotificationPermissionWarning.vue';

// ===== Initialization =====
export { registerNotificationInitializationTasks } from './initialization/notificationInitialization';
