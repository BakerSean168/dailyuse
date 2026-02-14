/**
 * Notification Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for Notification API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/notification.
 */

import type { IHttpClient } from '@dailyuse/http-client';
import type {
  NotificationClientDTO,
} from '@dailyuse/contracts/notification';
import type { ActionResult, CountResult } from '@dailyuse/contracts/result';

// ============ Transport Client Interfaces ============

// IHttpClient imported from @dailyuse/http-client

export interface IIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
}

// ============ Local Request/Response Types ============

export interface CreateNotificationRequest {
  type: string;
  title: string;
  content?: string;
  priority?: string;
  metadata?: Record<string, unknown>;
}

export interface QueryNotificationsRequest {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface NotificationListResponse {
  notifications: NotificationClientDTO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

// ============ Port Interface ============

/**
 * INotificationApiClient
 *
 * 通知模块 API 客户端接口
 */
export interface INotificationApiClient {
  createNotification(request: CreateNotificationRequest): Promise<NotificationClientDTO>;
  findNotifications(query?: QueryNotificationsRequest): Promise<NotificationListResponse>;
  findNotificationByUuid(uuid: string): Promise<NotificationClientDTO>;
  markAsRead(uuid: string): Promise<NotificationClientDTO>;
  markAllAsRead(): Promise<CountResult>;
  deleteNotification(uuid: string): Promise<ActionResult>;
  batchDeleteNotifications(uuids: string[]): Promise<CountResult>;
  getUnreadCount(): Promise<UnreadCountResponse>;
}
