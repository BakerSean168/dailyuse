/**
 * SQLite NotificationPreference Repository
 *
 * Skeleton implementation aligned to current domain contract.
 */

import type Database from 'better-sqlite3';
import type { NotificationPreference } from '../../../domain-server/aggregates/notification-preference';
import type { INotificationPreferenceRepository } from '../../../domain-server/repositories/INotificationPreferenceRepository';

export class SqliteNotificationPreferenceRepository implements INotificationPreferenceRepository {
  constructor(private readonly db: Database.Database) {}

  async save(preference: NotificationPreference): Promise<void> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async findById(id: string): Promise<NotificationPreference | null> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async findByIdentityId(identityId: string): Promise<NotificationPreference | null> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async exists(id: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async existsForIdentity(identityId: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async getOrCreate(identityId: string): Promise<NotificationPreference> {
    throw new Error('Not implemented - extract from apps/desktop');
  }
}

