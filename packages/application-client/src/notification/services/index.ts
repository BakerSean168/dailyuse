/**
 * Notification Module - Application Services
 */

export { CreateNotification } from './create-notification';
export { FindNotifications, type FindNotificationsOutput } from './find-notifications';
export { FindNotificationByUuid } from './find-notification-by-uuid';
export { MarkAsRead } from './mark-as-read';
export { MarkAllAsRead } from './mark-all-as-read';
export { DeleteNotification } from './delete-notification';
export { BatchDeleteNotifications } from './batch-delete-notifications';
export { GetUnreadCount } from './get-unread-count';

// Web-specific services
export { InAppNotificationService } from './InAppNotificationService';
export { NotificationApplicationService } from './NotificationApplicationService';
export { NotificationService } from './NotificationService';
