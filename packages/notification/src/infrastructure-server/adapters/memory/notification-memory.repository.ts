/**
 * Notification Memory Repository
 *
 * In-memory implementation of INotificationRepository for testing.
 */

import type { INotificationRepository } from '../../ports/notification-repository.port';
import type { Notification } from '@/domain-server';
import type { NotificationCategory, NotificationStatus } from '@dailyuse/contracts/notification';

/**
 * Notification Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class NotificationMemoryRepository implements INotificationRepository {
  private notifications = new Map<string, Notification>();

  async save(notification: Notification): Promise<void> {
    this.notifications.set((notification as any).uuid, notification);
  }

  async saveMany(notifications: Notification[]): Promise<void> {
    notifications.forEach((n: any) => this.notifications.set(n.uuid, n));
  }

  async findById(uuid: string, _options?: { includeChildren?: boolean }): Promise<Notification | null> {
    return this.notifications.get(uuid) ?? null;
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
    let result = Array.from(this.notifications.values()).filter((n: any) => n.accountUuid === accountUuid);

    if (!options?.includeRead) {
      result = result.filter((n: any) => n.status !== 'READ');
    }
    if (!options?.includeDeleted) {
      result = result.filter((n: any) => !n.deletedAt);
    }

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? result.length;
    return result.slice(offset, offset + limit);
  }

  async findByStatus(
    accountUuid: string,
    status: NotificationStatus,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    const filtered = Array.from(this.notifications.values()).filter(
      (n: any) => n.accountUuid === accountUuid && n.status === status,
    );
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? filtered.length;
    return filtered.slice(offset, offset + limit);
  }

  async findByCategory(
    accountUuid: string,
    category: NotificationCategory,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    const filtered = Array.from(this.notifications.values()).filter(
      (n: any) => n.accountUuid === accountUuid && n.category === category,
    );
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? filtered.length;
    return filtered.slice(offset, offset + limit);
  }

  async findUnread(accountUuid: string, options?: { limit?: number }): Promise<Notification[]> {
    const filtered = Array.from(this.notifications.values()).filter(
      (n: any) => n.accountUuid === accountUuid && n.status === 'UNREAD',
    );
    const limit = options?.limit ?? filtered.length;
    return filtered.slice(0, limit);
  }

  async findByRelatedEntity(relatedEntityType: string, relatedEntityUuid: string): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      (n: any) => n.relatedEntityType === relatedEntityType && n.relatedEntityUuid === relatedEntityUuid,
    );
  }

  async delete(uuid: string): Promise<void> {
    this.notifications.delete(uuid);
  }

  async deleteMany(uuids: string[]): Promise<void> {
    uuids.forEach((uuid) => this.notifications.delete(uuid));
  }

  async softDelete(uuid: string): Promise<void> {
    const notification = this.notifications.get(uuid) as any;
    if (notification) {
      notification.deletedAt = Date.now();
      this.notifications.set(uuid, notification);
    }
  }

  async exists(uuid: string): Promise<boolean> {
    return this.notifications.has(uuid);
  }

  async countUnread(accountUuid: string): Promise<number> {
    return Array.from(this.notifications.values()).filter(
      (n: any) => n.accountUuid === accountUuid && n.status === 'UNREAD',
    ).length;
  }

  async countByCategory(accountUuid: string): Promise<Record<NotificationCategory, number>> {
    const result: Partial<Record<NotificationCategory, number>> = {};
    Array.from(this.notifications.values())
      .filter((n: any) => n.accountUuid === accountUuid)
      .forEach((n: any) => {
        result[n.category as NotificationCategory] = (result[n.category as NotificationCategory] ?? 0) + 1;
      });
    return result as Record<NotificationCategory, number>;
  }

  async markManyAsRead(uuids: string[]): Promise<void> {
    uuids.forEach((uuid) => {
      const notification = this.notifications.get(uuid) as any;
      if (notification) {
        notification.status = 'READ';
        notification.readAt = Date.now();
        this.notifications.set(uuid, notification);
      }
    });
  }

  async markAllAsRead(accountUuid: string): Promise<void> {
    this.notifications.forEach((n: any) => {
      if (n.accountUuid === accountUuid && n.status === 'UNREAD') {
        n.status = 'READ';
        n.readAt = Date.now();
      }
    });
  }

  async cleanupExpired(beforeTimestamp: number): Promise<number> {
    let count = 0;
    this.notifications.forEach((n: any, uuid) => {
      if (n.expiresAt && n.expiresAt < beforeTimestamp) {
        this.notifications.delete(uuid);
        count++;
      }
    });
    return count;
  }

  async cleanupDeleted(beforeTimestamp: number): Promise<number> {
    let count = 0;
    this.notifications.forEach((n: any, uuid) => {
      if (n.deletedAt && n.deletedAt < beforeTimestamp) {
        this.notifications.delete(uuid);
        count++;
      }
    });
    return count;
  }

  // Test helpers
  clear(): void {
    this.notifications.clear();
  }

  seed(notifications: Notification[]): void {
    notifications.forEach((n: any) => this.notifications.set(n.uuid, n));
  }
}
