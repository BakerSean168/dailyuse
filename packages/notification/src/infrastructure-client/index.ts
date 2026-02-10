/**
 * Notification Module - Infrastructure Client
 *
 * Ports and Adapters for Notification module communication.
 */

// Container
export {
  NotificationContainer,
  NotificationDependencyKeys,
  type INotificationRepository,
} from './notification.container';

// Ports (Interfaces)
export {
  type INotificationApiClient,
  type CreateNotificationRequest,
  type QueryNotificationsRequest,
  type NotificationListResponse,
  type UnreadCountResponse,
} from './ports/notification-api-client.port';

// HTTP Adapters
export {
  NotificationHttpAdapter,
  createNotificationHttpAdapter,
} from './adapters/http/notification-http.adapter';

// IPC Adapters
export {
  NotificationIpcAdapter,
  createNotificationIpcAdapter,
} from './adapters/ipc/notification-ipc.adapter';
