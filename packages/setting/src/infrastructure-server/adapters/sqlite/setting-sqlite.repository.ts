/**
 * Setting SQLite Repository
 *
 * SQLite implementation of ISettingRepository.
 * Follows the same clean contract-first skeleton style as Prisma repository.
 */

import type Database from 'better-sqlite3';
import type { ISettingRepository } from '@/domain-server';
import type { Setting } from '@/domain-server/aggregates/setting';
import type { SettingScope } from '@dailyuse/contracts/setting';

export class SqliteSettingRepository implements ISettingRepository {
  constructor(private readonly db: Database.Database) {}

  async save(setting: Setting): Promise<void> {
    throw new Error('Not implemented - refactor sqlite persistence to new setting model');
  }

  async findById(id: string, options?: { includeHistory?: boolean }): Promise<Setting | null> {
    throw new Error('Not implemented - refactor sqlite persistence to new setting model');
  }

  async findByKey(key: string, scope: SettingScope, contextId?: string): Promise<Setting | null> {
    throw new Error('Not implemented - refactor sqlite persistence to new setting model');
  }

  async findByScope(
    scope: SettingScope,
    contextId?: string,
    options?: { includeHistory?: boolean },
  ): Promise<Setting[]> {
    throw new Error('Not implemented - refactor sqlite persistence to new setting model');
  }

  async findByGroup(groupId: string, options?: { includeHistory?: boolean }): Promise<Setting[]> {
    throw new Error('Not implemented - refactor sqlite persistence to new setting model');
  }

  async findSystemSettings(options?: { includeHistory?: boolean }): Promise<Setting[]> {
    throw new Error('Not implemented - refactor sqlite persistence to new setting model');
  }

  async findUserSettings(identityId: string, options?: { includeHistory?: boolean }): Promise<Setting[]> {
    throw new Error('Not implemented - refactor sqlite persistence to new setting model');
  }

  async findDeviceSettings(deviceId: string, options?: { includeHistory?: boolean }): Promise<Setting[]> {
    throw new Error('Not implemented - refactor sqlite persistence to new setting model');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented - refactor sqlite persistence to new setting model');
  }

  async exists(id: string): Promise<boolean> {
    throw new Error('Not implemented - refactor sqlite persistence to new setting model');
  }

  async existsByKey(key: string, scope: SettingScope, contextId?: string): Promise<boolean> {
    throw new Error('Not implemented - refactor sqlite persistence to new setting model');
  }

  async saveMany(settings: Setting[]): Promise<void> {
    throw new Error('Not implemented - refactor sqlite persistence to new setting model');
  }

  async search(query: string, scope?: SettingScope): Promise<Setting[]> {
    throw new Error('Not implemented - refactor sqlite persistence to new setting model');
  }
}
