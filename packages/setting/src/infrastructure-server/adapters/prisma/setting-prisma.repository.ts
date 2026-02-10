/**
 * Setting Prisma Repository
 *
 * Prisma implementation of ISettingRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { ISettingRepository } from '../../ports/setting-repository.port';
import type { Setting } from '@/domain-server';
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

  async findById(uuid: string, options?: { includeHistory?: boolean }): Promise<Setting | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByKey(key: string, scope: SettingScope, contextUuid?: string): Promise<Setting | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByScope(
    scope: SettingScope,
    contextUuid?: string,
    options?: { includeHistory?: boolean },
  ): Promise<Setting[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByGroup(groupUuid: string, options?: { includeHistory?: boolean }): Promise<Setting[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findSystemSettings(options?: { includeHistory?: boolean }): Promise<Setting[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findUserSettings(accountUuid: string, options?: { includeHistory?: boolean }): Promise<Setting[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findDeviceSettings(deviceId: string, options?: { includeHistory?: boolean }): Promise<Setting[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(uuid: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async existsByKey(key: string, scope: SettingScope, contextUuid?: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async saveMany(settings: Setting[]): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async search(query: string, scope?: SettingScope): Promise<Setting[]> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
