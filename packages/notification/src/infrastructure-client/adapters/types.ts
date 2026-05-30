/**
 * Notification Infrastructure Client - Transport Types
 *
 * Transport-specific interfaces and re-exports of port interfaces.
 * Port interfaces moved to application-client/ports/.
 */

import type { Result } from '@dailyuse/contracts/result';

// ============ Transport Client Interfaces ============

export interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
}

// ============ Port Interface Re-exports ============
export type {
  INotificationApiClient,
  CreateNotificationRequest,
  QueryNotificationsRequest,
  NotificationListResponse,
  UnreadCountResponse,
} from '../../application-client/ports/notification-api-client.port';
