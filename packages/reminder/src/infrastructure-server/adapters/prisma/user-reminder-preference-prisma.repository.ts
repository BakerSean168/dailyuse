/**
 * UserReminderPreferencePrismaRepository
 * Prisma implementation of IUserReminderPreferenceRepository
 *
 * 鑱氬悎鏍癸細UserReminderPreferences
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IUserReminderPreferenceRepository } from '../../../domain-server/repositories/IUserReminderPreferenceRepository';
import { UserReminderPreferences } from '../../../domain-server/aggregates/user-reminder-preferences';

export class UserReminderPreferencePrismaRepository
  implements IUserReminderPreferenceRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Prisma record 鈫?UserReminderPreferences 鑱氬悎鏍?
   */
  private mapToEntity(data: any): UserReminderPreferences {
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

  async save(preferences: UserReminderPreferences): Promise<void> {
    const dto = preferences.toPersistenceDTO();

    await this.prisma.userReminderPreference.upsert({
      where: { identityId: dto.identityId },
      create: {
        id: dto.id,
        identityId: dto.identityId,
        bestTimeSlots: dto.bestTimeSlots,
        worstTimeSlots: dto.worstTimeSlots,
        globalSmartFrequency: dto.globalSmartFrequency,
      },
      update: {
        bestTimeSlots: dto.bestTimeSlots,
        worstTimeSlots: dto.worstTimeSlots,
        globalSmartFrequency: dto.globalSmartFrequency,
      },
    });
  }

  async findByIdentityId(
    identityId: string,
  ): Promise<UserReminderPreferences | null> {
    const data = await this.prisma.userReminderPreference.findUnique({
      where: { identityId },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async delete(identityId: string): Promise<void> {
    await this.prisma.userReminderPreference.delete({
      where: { identityId },
    });
  }

  async exists(identityId: string): Promise<boolean> {
    const count = await this.prisma.userReminderPreference.count({
      where: { identityId },
    });
    return count > 0;
  }
}
