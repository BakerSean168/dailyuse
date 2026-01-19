import { PrismaClient } from '@prisma/client';
import type { INotificationPreferenceRepository } from '@dailyuse/domain-server/notification';
import { NotificationPreference } from '@dailyuse/domain-server/notification';

/**
 * NotificationPreference Prisma 仓储实现
 * 简单聚合根，无子实体
 * JSON 字段：category_preferences, doNotDisturb, rateLimits
 */
export class PrismaNotificationPreferenceRepository implements INotificationPreferenceRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: any): NotificationPreference {
    return NotificationPreference.fromPersistenceDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      enabled: data.enabled,
      channels: data.channels,
      categories: data.categories,
      doNotDisturb: data.doNotDisturb,
      rateLimit: data.rateLimit,
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
    });
  }

  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  async save(preference: NotificationPreference): Promise<void> {
    const persistence = preference.toPersistenceDTO();

    await this.prisma.notificationPreference.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        accountUuid: persistence.accountUuid,
        enabled: persistence.enabled,
        channels: persistence.channels,
        categories: persistence.categories,
        doNotDisturb: persistence.doNotDisturb,
        rateLimit: persistence.rateLimit,
        createdAt: this.toDate(persistence.createdAt) ?? new Date(),
        updatedAt: this.toDate(persistence.updatedAt) ?? new Date(),
      },
      update: {
        enabled: persistence.enabled,
        channels: persistence.channels,
        categories: persistence.categories,
        doNotDisturb: persistence.doNotDisturb,
        rateLimit: persistence.rateLimit,
        updatedAt: this.toDate(persistence.updatedAt) ?? new Date(),
      },
    });
  }

  async findById(uuid: string): Promise<NotificationPreference | null> {
    const data = await this.prisma.notificationPreference.findUnique({ where: { uuid } });
    return data ? this.mapToEntity(data) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<NotificationPreference | null> {
    const data = await this.prisma.notificationPreference.findUnique({ where: { accountUuid } });
    return data ? this.mapToEntity(data) : null;
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.notificationPreference.delete({ where: { uuid } });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.notificationPreference.count({ where: { uuid } });
    return count > 0;
  }

  async existsForAccount(accountUuid: string): Promise<boolean> {
    const count = await this.prisma.notificationPreference.count({ where: { accountUuid } });
    return count > 0;
  }

  async getOrCreate(accountUuid: string): Promise<NotificationPreference> {
    const existing = await this.findByAccountUuid(accountUuid);
    if (existing) return existing;

    const preference = NotificationPreference.create({ accountUuid });
    await this.save(preference);
    return preference;
  }
}
