/**
 * Notification Application Client Layer
 * 通知模块客户端应用层
 *
 * 简化版 - 只导出必要的类型和事件
 */

// Client Service
export { NotificationClientService } from './notification-client-service';

// Re-export events if still needed
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

// Re-export as alias for backward compatibility
export { NotificationClientService as NotificationApplicationService } from './notification-client-service';

// Singleton placeholder
let _notificationApplicationService: any = null;

export function setNotificationApplicationService(service: any) {
  _notificationApplicationService = service;
}

export const notificationApplicationService: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!_notificationApplicationService) {
      throw new Error('notificationApplicationService not initialized. Call setNotificationApplicationService first.');
    }
    return (_notificationApplicationService as any)[prop];
  }
});

