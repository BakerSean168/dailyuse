/**
 * Notification Prisma Repository
 *
 * Prisma implementation of INotificationRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { INotificationRepository } from '../../ports/notification-repository.port';
import type { Notification } from '../../../domain-server/aggregates/notification';
import type { NotificationCategory, NotificationStatus } from '@dailyuse/contracts/notification';

/**
 * Notification Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class NotificationPrismaRepository implements INotificationRepository {
  constructor(private readonly prisma: any) {}

  async save(notification: Notification): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async saveMany(notifications: Notification[]): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findById(uuid: string, options?: { includeChildren?: boolean }): Promise<Notification | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: {
      includeChildren?: boolean;
      includeRead?: boolean;
      includeDeleted?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<Notification[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByStatus(
    accountUuid: string,
    status: NotificationStatus,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByCategory(
    accountUuid: string,
    category: NotificationCategory,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findUnread(accountUuid: string, options?: { limit?: number }): Promise<Notification[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByRelatedEntity(relatedEntityType: string, relatedEntityUuid: string): Promise<Notification[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async deleteMany(uuids: string[]): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async softDelete(uuid: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(uuid: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async countUnread(accountUuid: string): Promise<number> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async countByCategory(accountUuid: string): Promise<Record<NotificationCategory, number>> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async markManyAsRead(uuids: string[]): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async markAllAsRead(accountUuid: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async cleanupExpired(beforeTimestamp: number): Promise<number> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async cleanupDeleted(beforeTimestamp: number): Promise<number> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
