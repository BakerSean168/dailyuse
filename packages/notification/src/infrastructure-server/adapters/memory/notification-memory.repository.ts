/**
 * Notification Memory Repository
 *
 * In-memory implementation of INotificationRepository for testing.
 */

import type { INotificationRepository } from '../../../domain-server';
import type { Notification } from '../../../domain-server/aggregates/notification';
import type { NotificationCategory, NotificationStatus } from '@dailyuse/contracts/notification';

/**
 * Notification Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class NotificationMemoryRepository implements INotificationRepository {
  private notifications = new Map<string, Notification>();

  async save(notification: Notification): Promise<void> {
    this.notifications.set((notification as any).id, notification);
  }

  async saveMany(notifications: Notification[]): Promise<void> {
    notifications.forEach((n: any) => this.notifications.set(n.id, n));
  }

  async findById(id: string, _options?: { includeChildren?: boolean }): Promise<Notification | null> {
    return this.notifications.get(id) ?? null;
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
    let result = Array.from(this.notifications.values()).filter((n: any) => n.identityId === identityId);

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
    identityId: string,
    status: NotificationStatus,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    const filtered = Array.from(this.notifications.values()).filter(
      (n: any) => n.identityId === identityId && n.status === status,
    );
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? filtered.length;
    return filtered.slice(offset, offset + limit);
  }

  async findByCategory(
    identityId: string,
    category: NotificationCategory,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    const filtered = Array.from(this.notifications.values()).filter(
      (n: any) => n.identityId === identityId && n.category === category,
    );
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? filtered.length;
    return filtered.slice(offset, offset + limit);
  }

  async findUnread(identityId: string, options?: { limit?: number }): Promise<Notification[]> {
    const filtered = Array.from(this.notifications.values()).filter(
      (n: any) => n.identityId === identityId && n.status === 'UNREAD',
    );
    const limit = options?.limit ?? filtered.length;
    return filtered.slice(0, limit);
  }

  async findByRelatedEntity(relatedEntityType: string, relatedEntityId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      (n: any) => n.relatedEntityType === relatedEntityType && n.relatedEntityId === relatedEntityId,
    );
  }

  async delete(id: string): Promise<void> {
    this.notifications.delete(id);
  }

  async deleteMany(ids: string[]): Promise<void> {
    ids.forEach((id) => this.notifications.delete(id));
  }

  async softDelete(id: string): Promise<void> {
    const notification = this.notifications.get(id) as any;
    if (notification) {
      notification.deletedAt = Date.now();
      this.notifications.set(id, notification);
    }
  }

  async exists(id: string): Promise<boolean> {
    return this.notifications.has(id);
  }

  async countUnread(identityId: string): Promise<number> {
    return Array.from(this.notifications.values()).filter(
      (n: any) => n.identityId === identityId && n.status === 'UNREAD',
    ).length;
  }

  async countByCategory(identityId: string): Promise<Record<NotificationCategory, number>> {
    const result: Partial<Record<NotificationCategory, number>> = {};
    Array.from(this.notifications.values())
      .filter((n: any) => n.identityId === identityId)
      .forEach((n: any) => {
        result[n.category as NotificationCategory] = (result[n.category as NotificationCategory] ?? 0) + 1;
      });
    return result as Record<NotificationCategory, number>;
  }

  async markManyAsRead(ids: string[]): Promise<void> {
    ids.forEach((id) => {
      const notification = this.notifications.get(id) as any;
      if (notification) {
        notification.status = 'READ';
        notification.readAt = Date.now();
        this.notifications.set(id, notification);
      }
    });
  }

  async markAllAsRead(identityId: string): Promise<void> {
    this.notifications.forEach((n: any) => {
      if (n.identityId === identityId && n.status === 'UNREAD') {
        n.status = 'READ';
        n.readAt = Date.now();
      }
    });
  }

  async cleanupExpired(beforeTimestamp: number): Promise<number> {
    let count = 0;
    this.notifications.forEach((n: any, id) => {
      if (n.expiresAt && n.expiresAt < beforeTimestamp) {
        this.notifications.delete(id);
        count++;
      }
    });
    return count;
  }

  async cleanupDeleted(beforeTimestamp: number): Promise<number> {
    let count = 0;
    this.notifications.forEach((n: any, id) => {
      if (n.deletedAt && n.deletedAt < beforeTimestamp) {
        this.notifications.delete(id);
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
    notifications.forEach((n: any) => this.notifications.set(n.id, n));
  }
}
