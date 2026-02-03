/**
 * Notification List Result DTO
 */

import type { NotificationServerDTO } from '../aggregates/notification-server';
import type { NotificationCategory, NotificationType, NotificationStatus } from '../value-objects';

export interface NotificationListResultDTO {
  notifications: NotificationServerDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface NotificationStatsDTO {
  unreadCount: number;
  totalCount: number;
  byCategory: Record<NotificationCategory, number>;
  byType: Record<NotificationType, number>;
  byStatus: Record<NotificationStatus, number>;
}
