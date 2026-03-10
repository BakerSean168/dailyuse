import type { TimeSlotDTO } from '@dailyuse/contracts/reminder';
import { UserReminderPreferences } from '../../../../domain-server/aggregates/user-reminder-preferences';

export type PowerSyncUserReminderPreferenceRow = {
  id: string;
  identity_id: string;
  best_time_slots: string | null;
  worst_time_slots: string | null;
  global_smart_frequency: number | boolean;
  created_at: string;
  updated_at: string;
};

export class PowerSyncUserReminderPreferenceMapper {
  static toDomain(data: PowerSyncUserReminderPreferenceRow): UserReminderPreferences {
    return UserReminderPreferences.load({
      id: data.id,
      identityId: data.identity_id,
      bestTimeSlots: JSON.parse(data.best_time_slots ?? '[]') as TimeSlotDTO[],
      worstTimeSlots: JSON.parse(data.worst_time_slots ?? '[]') as TimeSlotDTO[],
      globalSmartFrequency:
        data.global_smart_frequency === true || data.global_smart_frequency === 1,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }
}
