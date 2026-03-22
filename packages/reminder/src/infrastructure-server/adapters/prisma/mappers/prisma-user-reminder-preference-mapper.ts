/**
 * Prisma UserReminderPreference Mapper
 *
 * Maps between UserReminderPreferences domain aggregate and Prisma model.
 */

import type { UserReminderPreference as PrismaUserReminderPreference } from '@dailyuse/database';
import type { TimeSlotDTO } from '@dailyuse/contracts/reminder';
import { UserReminderPreferences } from '@/domain-server/aggregates/user-reminder-preferences';

export class PrismaUserReminderPreferenceMapper {
  /**
   * Prisma record → UserReminderPreferences aggregate root
   */
  static toDomain(data: PrismaUserReminderPreference): UserReminderPreferences {
    return UserReminderPreferences.load({
      id: data.id,
      identityId: data.identityId,
      bestTimeSlots: JSON.parse(data.bestTimeSlots ?? '[]') as TimeSlotDTO[],
      worstTimeSlots: JSON.parse(data.worstTimeSlots ?? '[]') as TimeSlotDTO[],
      globalReminderEnabled: data.globalReminderEnabled ?? true,
      globalSmartFrequency: data.globalSmartFrequency,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
