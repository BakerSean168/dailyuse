/**
 * UserSetting SQLite Repository
 *
 * SQLite implementation of IUserSettingRepository.
 * Stores preferences as JSON text in a single row.
 */

import type Database from 'better-sqlite3';
import type { IDomainEvent } from '@dailyuse/contracts/shared';
import type { IUserSettingRepository } from '@/domain-server/repositories/IUserSettingRepository';
import { UserSetting, type UserSettingState } from '@/domain-server/aggregates/user-setting';
import { SettingId } from '@/domain-shared/value-objects/setting-id';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { UserPreferencesSchema, type SettingEventMap } from '@dailyuse/contracts/setting';
import { eventBus } from '@dailyuse/utils';

interface UserSettingRow {
  id: string;
  identity_id: string;
  preferences: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export class SqliteUserSettingRepository implements IUserSettingRepository {
  constructor(private readonly db: Database.Database) {}

  async save(setting: UserSetting): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO user_settings (id, identity_id, preferences, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(identity_id) DO UPDATE SET
        preferences = excluded.preferences,
        version = excluded.version,
        updated_at = datetime('now')
    `);
    stmt.run(
      setting.id,
      setting.identityId,
      JSON.stringify(setting.toPreferences()),
      setting.version,
    );

    this.publishDomainEvents(setting.pullDomainEvents());
  }

  async findByIdentityId(identityId: string): Promise<UserSetting | null> {
    const row = this.db.prepare(
      'SELECT * FROM user_settings WHERE identity_id = ?',
    ).get(identityId) as UserSettingRow | undefined;

    if (!row) return null;

    const preferences = UserPreferencesSchema.parse(JSON.parse(row.preferences));

    const state: UserSettingState = {
      id: SettingId.of(row.id),
      identityId: IdentityId.of(row.identity_id),
      preferences,
      version: row.version,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return UserSetting.load(state);
  }

  async delete(identityId: string): Promise<void> {
    this.db.prepare('DELETE FROM user_settings WHERE identity_id = ?').run(identityId);
  }

  private publishDomainEvents(events: ReadonlyArray<IDomainEvent>): void {
    for (const event of events) {
      eventBus.send(
        event.eventType as keyof SettingEventMap,
        event.payload as SettingEventMap[keyof SettingEventMap],
      );
    }
  }
}
