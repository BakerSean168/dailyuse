/**
 * Notification Services (Server)
 *
 * Server-side services for notification operations.
 * Each service represents a single business operation.
 *
 * Pattern:
 * - Each service is a class with a single `execute` method
 * - Dependencies are injected via constructor
 * - Returns DTOs, not domain objects
 * - 类型定义请从 @dailyuse/contracts/notification 导入
 */

// ============================================================
// Notification Services
// ============================================================

export { CreateNotification, createNotification } from './create-notification';
export { GetUserNotifications, getUserNotifications } from './get-user-notifications';
export { GetUnreadNotifications, getUnreadNotifications, getUnreadNotificationCount } from './get-unread-notifications';
export { MarkNotificationAsRead, markNotificationAsRead, markNotificationsAsRead, markAllNotificationsAsRead } from './mark-notification-as-read';

// ============================================================
// Notification Preference Services
// ============================================================

export { GetNotificationPreference, getNotificationPreference, getOrCreateNotificationPreference } from './get-notification-preference';

// ============================================================
// DTO Converters
// ============================================================

export { toNotificationClientDTO, toNotificationPreferenceClientDTO } from './notification-dto-converters';

