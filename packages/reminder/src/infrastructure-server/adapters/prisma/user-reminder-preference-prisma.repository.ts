/**
 * UserReminderPreferencePrismaRepository
 * Prisma implementation of IUserReminderPreferenceRepository
 *
 * 用户提醒偏好仓储 - Prisma实现
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IUserReminderPreferenceRepository } from '../../../domain-server/repositories/IUserReminderPreferenceRepository';
import type { UserReminderPreferencesServerDTO } from '@dailyuse/contracts/reminder';

export class UserReminderPreferencePrismaRepository
  implements IUserReminderPreferenceRepository
{
  constructor(private prisma: PrismaClient) {}

  private mapToDTO(data: any): UserReminderPreferencesServerDTO {
    return {
      uuid: data.id,
      accountUuid: data.identityId,
      bestTimeSlots: data.bestTimeSlots
        ? JSON.parse(data.bestTimeSlots)
        : [],
      worstTimeSlots: data.worstTimeSlots
        ? JSON.parse(data.worstTimeSlots)
        : [],
      globalSmartFrequency: data.globalSmartFrequency,
      createdAt: data.createdAt instanceof Date
        ? data.createdAt.getTime()
        : data.createdAt,
      updatedAt: data.updatedAt instanceof Date
        ? data.updatedAt.getTime()
        : data.updatedAt,
    };
  }

  async upsert(
    preferences: UserReminderPreferencesServerDTO,
  ): Promise<UserReminderPreferencesServerDTO> {
    const data = await (this.prisma as any).userReminderPreference.upsert({
      where: { identityId: preferences.accountUuid },
      create: {
        id: preferences.uuid,
        identityId: preferences.accountUuid,
        bestTimeSlots: JSON.stringify(preferences.bestTimeSlots),
        worstTimeSlots: JSON.stringify(preferences.worstTimeSlots),
        globalSmartFrequency: preferences.globalSmartFrequency,
      },
      update: {
        bestTimeSlots: JSON.stringify(preferences.bestTimeSlots),
        worstTimeSlots: JSON.stringify(preferences.worstTimeSlots),
        globalSmartFrequency: preferences.globalSmartFrequency,
      },
    });
    return this.mapToDTO(data);
  }

  async findByAccountUuid(
    accountUuid: string,
  ): Promise<UserReminderPreferencesServerDTO | null> {
    const data = await (this.prisma as any).userReminderPreference.findUnique({
      where: { identityId: accountUuid },
    });
    return data ? this.mapToDTO(data) : null;
  }

  async delete(accountUuid: string): Promise<boolean> {
    try {
      await (this.prisma as any).userReminderPreference.delete({
        where: { identityId: accountUuid },
      });
      return true;
    } catch {
      return false;
    }
  }

  async exists(accountUuid: string): Promise<boolean> {
    const count = await (this.prisma as any).userReminderPreference.count({
      where: { identityId: accountUuid },
    });
    return count > 0;
  }
}
