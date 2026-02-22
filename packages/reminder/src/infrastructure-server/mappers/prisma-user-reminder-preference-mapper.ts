/**
 * Prisma UserReminderPreference Mapper
 *
 * Maps between UserReminderPreferences domain aggregate and Prisma model.
 */

import type { UserReminderPreference as PrismaUserReminderPreference } from '@dailyuse/database';
import { UserReminderPreferences } from '../../../domain-server/aggregates/user-reminder-preferences';

export class PrismaUserReminderPreferenceMapper {
  /**
   * Prisma record → UserReminderPreferences aggregate root
   */
  static toDomain(data: PrismaUserReminderPreference): UserReminderPreferences {
    return UserReminderPreferences.fromPersistenceDTO({
      id: data.id,
      identityId: data.identityId,
      bestTimeSlots: data.bestTimeSlots ?? '[]',
      worstTimeSlots: data.worstTimeSlots ?? '[]',
      globalSmartFrequency: data.globalSmartFrequency,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
