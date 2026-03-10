import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { INotificationRepository } from '../../../domain-server/repositories/INotificationRepository';
import type { Notification } from '../../../domain-server/aggregates/notification';
import type { NotificationCategory, NotificationStatus } from '@dailyuse/contracts/notification';

export class PowerSyncNotificationRepository implements INotificationRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async save(_notification: Notification): Promise<void> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async saveMany(_notifications: Notification[]): Promise<void> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async findById(
    _id: string,
    _options?: { includeChildren?: boolean },
  ): Promise<Notification | null> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async findByIdentityId(
    _identityId: string,
    _options?: {
      includeChildren?: boolean;
      includeRead?: boolean;
      includeDeleted?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<Notification[]> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async findByStatus(
    _identityId: string,
    _status: NotificationStatus,
    _options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async findByCategory(
    _identityId: string,
    _category: NotificationCategory,
    _options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async findUnread(_identityId: string, _options?: { limit?: number }): Promise<Notification[]> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async findByRelatedEntity(
    _relatedEntityType: string,
    _relatedEntityId: string,
  ): Promise<Notification[]> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async deleteMany(_ids: string[]): Promise<void> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async softDelete(_id: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async exists(_id: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async countUnread(_identityId: string): Promise<number> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async countByCategory(_identityId: string): Promise<Record<NotificationCategory, number>> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async markManyAsRead(_ids: string[]): Promise<void> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async markAllAsRead(_identityId: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async cleanupExpired(_beforeTimestamp: number): Promise<number> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async cleanupDeleted(_beforeTimestamp: number): Promise<number> {
    throw new Error('Not implemented - extract from apps/desktop');
  }
}
