/**
 * Notification Prisma Repository
 *
 * Prisma implementation of INotificationRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 *
 * TODO(identityId): When implementing, ensure all toDomain mappers propagate
 * identityId from Prisma rows to domain entities. See reminder/task/goal modules
 * for reference patterns (e.g., `identityId: data.identityId`).
 */

import type { PrismaClient } from '@dailyuse/database';
import type { INotificationRepository } from '../../../domain-server';
import type { Notification } from '../../../domain-server/aggregates/notification';
import type { NotificationCategory, NotificationStatus } from '@dailyuse/contracts/notification';

/**
 * Notification Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class NotificationPrismaRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(notification: Notification): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async saveMany(notifications: Notification[]): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findById(id: string, options?: { includeChildren?: boolean }): Promise<Notification | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByIdentityId(
    identityId: string,
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
    identityId: string,
    status: NotificationStatus,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByCategory(
    identityId: string,
    category: NotificationCategory,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findUnread(identityId: string, options?: { limit?: number }): Promise<Notification[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByRelatedEntity(relatedEntityType: string, relatedEntityId: string): Promise<Notification[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async deleteMany(ids: string[]): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async softDelete(id: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(id: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async countUnread(identityId: string): Promise<number> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async countByCategory(identityId: string): Promise<Record<NotificationCategory, number>> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async markManyAsRead(ids: string[]): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async markAllAsRead(identityId: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async cleanupExpired(beforeTimestamp: number): Promise<number> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async cleanupDeleted(beforeTimestamp: number): Promise<number> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
