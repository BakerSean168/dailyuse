/**
 * NotificationPreference Prisma Repository
 *
 * Prisma implementation of INotificationPreferenceRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { INotificationPreferenceRepository } from '../../ports/notification-preference-repository.port';
import type { NotificationPreference } from '../../../domain-server/aggregates/notification-preference';

/**
 * NotificationPreference Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class NotificationPreferencePrismaRepository implements INotificationPreferenceRepository {
  constructor(private readonly prisma: any) {}

  async save(preference: NotificationPreference): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findById(uuid: string): Promise<NotificationPreference | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByAccountUuid(accountUuid: string): Promise<NotificationPreference | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(uuid: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async existsForAccount(accountUuid: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async getOrCreate(accountUuid: string): Promise<NotificationPreference> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
