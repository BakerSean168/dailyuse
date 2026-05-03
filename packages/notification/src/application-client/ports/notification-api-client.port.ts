/**
 * Notification API Client Port
 *
 * Transport-agnostic interface for Notification API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/notification.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import type { ActionResult, CountResult } from '@dailyuse/contracts/result';

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
  createNotification(request: CreateNotificationRequest): Promise<Result<NotificationClientDTO>>;
  findNotifications(query?: QueryNotificationsRequest): Promise<Result<NotificationListResponse>>;
  findNotificationById(id: string): Promise<Result<NotificationClientDTO>>;
  markAsRead(id: string): Promise<Result<NotificationClientDTO>>;
  markAllAsRead(): Promise<Result<CountResult>>;
  deleteNotification(id: string): Promise<Result<ActionResult>>;
  batchDeleteNotifications(ids: string[]): Promise<Result<CountResult>>;
  getUnreadCount(): Promise<Result<UnreadCountResponse>>;
}
