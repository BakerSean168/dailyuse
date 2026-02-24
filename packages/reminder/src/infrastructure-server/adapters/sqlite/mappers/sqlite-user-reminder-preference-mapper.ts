import type { TimeSlotDTO } from '@dailyuse/contracts/reminder';
import { UserReminderPreferences } from '@/domain-server/aggregates/user-reminder-preferences';

export interface UserReminderPreferenceSqliteRow {
  id: string;
  identity_id: string;
  best_time_slots: string | null;
  worst_time_slots: string | null;
  global_smart_frequency: number;
  created_at: number;
  updated_at: number;
}

export class SqliteUserReminderPreferenceMapper {
  static toDomain(row: UserReminderPreferenceSqliteRow): UserReminderPreferences {
    return UserReminderPreferences.load({
      id: row.id,
      identityId: row.identity_id,
      bestTimeSlots: JSON.parse(row.best_time_slots ?? '[]') as TimeSlotDTO[],
      worstTimeSlots: JSON.parse(row.worst_time_slots ?? '[]') as TimeSlotDTO[],
      globalSmartFrequency: row.global_smart_frequency === 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
