/**
 * Notification Module
 *
 * 通知模块 - 应用层服务
 */

// Events & Constants
export {
  NOTIFICATION_EVENTS,
  SCHEDULE_EVENTS,
  publishReminderTriggered,
  publishNotificationCreated,
  publishNotificationShown,
  publishNotificationClicked,
  publishNotificationClosed,
  publishNotificationFailed,
  publishPermissionChanged,
  publishConfigUpdated,
  publishDndEnabled,
  publishDndDisabled,
  publishNotificationError,
  publishQueueFull,
  publishServiceInitialized,
  onReminderTriggered,
  onScheduleReminderTriggered,
  removeNotificationEventListeners,
} from './notificationEvents';
export type {
  NotificationCreatedPayload,
  NotificationShownPayload,
  NotificationInteractionPayload,
  PermissionChangedPayload,
  ConfigUpdatedPayload,
  NotificationErrorPayload,
} from './notificationEvents';

// Container
// Smart Container
export { NotificationApplicationService, notificationApplicationService } from './notification-application.service';

export { NotificationContainer } from '@/infrastructure-client';

// Services
export {
  CreateNotification,
  FindNotifications,
  FindNotificationByUuid,
  MarkAsRead,
  MarkAllAsRead,
  DeleteNotification,
  BatchDeleteNotifications,
  GetUnreadCount,
  type FindNotificationsOutput,
} from './services';
