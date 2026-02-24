import type Database from 'better-sqlite3';
import type { IUserReminderPreferenceRepository } from '../../../domain-server/repositories/IUserReminderPreferenceRepository';
import type { UserReminderPreferences } from '../../../domain-server/aggregates/user-reminder-preferences';
import { SqliteUserReminderPreferenceMapper, type UserReminderPreferenceSqliteRow } from './mappers/sqlite-user-reminder-preference-mapper';

export class UserReminderPreferenceSqliteRepository
  implements IUserReminderPreferenceRepository
{
  constructor(private readonly db: Database.Database) {}

  async save(preferences: UserReminderPreferences): Promise<void> {
    const dto = preferences.toServerDTO();

    this.db.prepare(`
      INSERT INTO user_reminder_preferences (
        id, identity_id, best_time_slots, worst_time_slots,
        global_smart_frequency, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(identity_id) DO UPDATE SET
        best_time_slots = excluded.best_time_slots,
        worst_time_slots = excluded.worst_time_slots,
        global_smart_frequency = excluded.global_smart_frequency,
        updated_at = excluded.updated_at
    `).run(
      dto.id,
      dto.identityId,
      JSON.stringify(dto.bestTimeSlots ?? []),
      JSON.stringify(dto.worstTimeSlots ?? []),
      dto.globalSmartFrequency ? 1 : 0,
      typeof dto.createdAt === 'number' ? dto.createdAt : new Date(dto.createdAt).getTime(),
      typeof dto.updatedAt === 'number' ? dto.updatedAt : new Date(dto.updatedAt).getTime(),
    );
  }

  async findByIdentityId(identityId: string): Promise<UserReminderPreferences | null> {
    const row = this.db.prepare(
      `SELECT * FROM user_reminder_preferences WHERE identity_id = ? LIMIT 1`
    ).get(identityId) as UserReminderPreferenceSqliteRow | undefined;

    return row ? SqliteUserReminderPreferenceMapper.toDomain(row) : null;
  }

  async delete(identityId: string): Promise<void> {
    this.db.prepare(`DELETE FROM user_reminder_preferences WHERE identity_id = ?`).run(identityId);
  }

  async exists(identityId: string): Promise<boolean> {
    const row = this.db.prepare(
      `SELECT identity_id FROM user_reminder_preferences WHERE identity_id = ? LIMIT 1`
    ).get(identityId) as { identity_id: string } | undefined;

    return row !== undefined;
  }
}
