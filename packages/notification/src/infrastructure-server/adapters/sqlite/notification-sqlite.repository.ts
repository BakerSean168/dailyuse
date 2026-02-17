/**
 * Notification SQLite Repository
 *
 * SQLite implementation of INotificationRepository.
 * Uses clean interface-aligned skeleton while persistence migration is ongoing.
 */

import type Database from 'better-sqlite3';
import type { INotificationRepository } from '../../../domain-server/repositories/INotificationRepository';
import type { Notification } from '../../../domain-server/aggregates/notification';
import type { NotificationCategory, NotificationStatus } from '@dailyuse/contracts/notification';

export class SqliteNotificationRepository implements INotificationRepository {
  constructor(private readonly db: Database.Database) {}

  async save(notification: Notification): Promise<void> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }

  async saveMany(notifications: Notification[]): Promise<void> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }

  async findById(id: string, options?: { includeChildren?: boolean }): Promise<Notification | null> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
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
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }

  async findByStatus(
    identityId: string,
    status: NotificationStatus,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }

  async findByCategory(
    identityId: string,
    category: NotificationCategory,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }

  async findUnread(identityId: string, options?: { limit?: number }): Promise<Notification[]> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }

  async findByRelatedEntity(relatedEntityType: string, relatedEntityId: string): Promise<Notification[]> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }

  async deleteMany(ids: string[]): Promise<void> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }

  async softDelete(id: string): Promise<void> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }

  async exists(id: string): Promise<boolean> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }

  async countUnread(identityId: string): Promise<number> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }

  async countByCategory(identityId: string): Promise<Record<NotificationCategory, number>> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }

  async markManyAsRead(ids: string[]): Promise<void> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }

  async markAllAsRead(identityId: string): Promise<void> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }

  async cleanupExpired(beforeTimestamp: number): Promise<number> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }

  async cleanupDeleted(beforeTimestamp: number): Promise<number> {
    throw new Error('Not implemented - refactor sqlite persistence to new notification model');
  }
}
