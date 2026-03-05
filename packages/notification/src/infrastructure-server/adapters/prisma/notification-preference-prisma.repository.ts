/**
 * NotificationPreference Prisma Repository
 *
 * Prisma implementation of INotificationPreferenceRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 *
 * TODO(identityId): When implementing, ensure all toDomain mappers propagate
 * identityId from Prisma rows to domain entities. See reminder/task/goal modules
 * for reference patterns (e.g., `identityId: data.identityId`).
 */

import type { PrismaClient } from '@dailyuse/database';
import type { INotificationPreferenceRepository } from '../../../domain-server';
import type { NotificationPreference } from '../../../domain-server/aggregates/notification-preference';

/**
 * NotificationPreference Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class NotificationPreferencePrismaRepository implements INotificationPreferenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(preference: NotificationPreference): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findById(id: string): Promise<NotificationPreference | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByIdentityId(identityId: string): Promise<NotificationPreference | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(id: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async existsForIdentity(identityId: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async getOrCreate(identityId: string): Promise<NotificationPreference> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
