/**
 * UserSetting SQLite Repository
 *
 * SQLite implementation of IUserSettingRepository.
 * Uses a clean interface-aligned skeleton while persistence is being migrated.
 */

import type Database from 'better-sqlite3';
import type { IUserSettingRepository } from '@/domain-server/repositories/IUserSettingRepository';
import type { UserSetting } from '@/domain-server/aggregates/user-setting';

export class SqliteUserSettingRepository implements IUserSettingRepository {
  constructor(private readonly db: Database.Database) {}

  async save(setting: UserSetting): Promise<void> {
    throw new Error('Not implemented - refactor sqlite persistence to new user-setting model');
  }

  async findByIdentityId(identityId: string): Promise<UserSetting | null> {
    throw new Error('Not implemented - refactor sqlite persistence to new user-setting model');
  }

  async delete(identityId: string): Promise<void> {
    throw new Error('Not implemented - refactor sqlite persistence to new user-setting model');
  }
}
