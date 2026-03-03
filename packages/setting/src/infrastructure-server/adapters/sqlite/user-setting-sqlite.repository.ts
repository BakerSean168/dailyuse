/**
 * UserSetting SQLite Repository
 *
 * SQLite implementation of IUserSettingRepository.
 * Stores preferences as JSON text in a single row.
 */

import type Database from 'better-sqlite3';
import type { IDomainEvent } from '@dailyuse/contracts/shared';
import type { IUserSettingRepository } from '@/domain-server/repositories/IUserSettingRepository';
import { UserSetting } from '@/domain-server/aggregates/user-setting';
import type { SettingEventMap } from '@dailyuse/contracts/setting';
import { eventBus } from '@dailyuse/utils';
import { SqliteUserSettingMapper, type SqliteUserSettingRow } from './mappers';

export class SqliteUserSettingRepository implements IUserSettingRepository {
  constructor(private readonly db: Database.Database) {}

  async save(setting: UserSetting): Promise<void> {
    const data = SqliteUserSettingMapper.toPersistence(setting);

    const stmt = this.db.prepare(`
      INSERT INTO user_settings (id, identity_id, preferences, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(identity_id) DO UPDATE SET
        preferences = excluded.preferences,
        version = excluded.version,
        updated_at = excluded.updated_at
    `);
    const now = Date.now();
    stmt.run(data.id, data.identityId, data.preferences, data.version, now, now);

    this.publishDomainEvents(setting.pullDomainEvents());
  }

  async findByIdentityId(identityId: string): Promise<UserSetting | null> {
    const row = this.db
      .prepare('SELECT * FROM user_settings WHERE identity_id = ?')
      .get(identityId) as SqliteUserSettingRow | undefined;

    if (!row) return null;

    return SqliteUserSettingMapper.toDomain(row);
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
