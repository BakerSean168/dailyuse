/**
 * Setting Prisma Repository
 *
 * Prisma implementation of ISettingRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { ISettingRepository } from '@/domain-server';
import type { Setting } from '@/domain-server/aggregates/setting';
import type { SettingScope } from '@dailyuse/contracts/setting';

/**
 * Setting Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class SettingPrismaRepository implements ISettingRepository {
  constructor(private readonly prisma: any) {}

  async save(setting: Setting): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findById(id: string, options?: { includeHistory?: boolean }): Promise<Setting | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByKey(key: string, scope: SettingScope, contextId?: string): Promise<Setting | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByScope(
    scope: SettingScope,
    contextId?: string,
    options?: { includeHistory?: boolean },
  ): Promise<Setting[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByGroup(groupId: string, options?: { includeHistory?: boolean }): Promise<Setting[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findSystemSettings(options?: { includeHistory?: boolean }): Promise<Setting[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findUserSettings(identityId: string, options?: { includeHistory?: boolean }): Promise<Setting[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findDeviceSettings(deviceId: string, options?: { includeHistory?: boolean }): Promise<Setting[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(id: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async existsByKey(key: string, scope: SettingScope, contextId?: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async saveMany(settings: Setting[]): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async search(query: string, scope?: SettingScope): Promise<Setting[]> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
