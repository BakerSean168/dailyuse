/**
 * Notification Module - Infrastructure Client
 *
 * Adapters and container for Notification module communication.
 */

// Container
export {
  NotificationContainer,
  NotificationDependencyKeys,
} from './notification.container';

// Port Interfaces
export type {
  INotificationApiClient,
  CreateNotificationRequest,
  QueryNotificationsRequest,
  NotificationListResponse,
  UnreadCountResponse,
  IIpcClient,
} from './adapters/types';

// HTTP Adapters
export {
  NotificationHttpAdapter,
  createNotificationHttpAdapters,
  type NotificationHttpAdapters,
} from './adapters/http';

// IPC Adapters
export {
  NotificationIpcAdapter,
  createNotificationIpcAdapters,
  type NotificationIpcAdapters,
} from './adapters/ipc';
