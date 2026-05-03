/**
 * NotificationPreference Prisma Repository.
 * 通知偏好 Prisma 仓储。
 *
 * Prisma implementation of INotificationPreferenceRepository.
 * INotificationPreferenceRepository 的 Prisma 实现。
 */

import type { PrismaClient } from '@dailyuse/database';
import type { INotificationPreferenceRepository } from '../../../domain-server';
import { NotificationPreference } from '../../../domain-server/aggregates/notification-preference';
import { NotificationChannelType } from '@dailyuse/contracts/notification';
import { generateUUID } from '@dailyuse/utils';
import {
  NotificationPreferencePrismaMapper,
  type PrismaNotificationPreferenceRow,
} from './mappers/notification-preference-prisma.mapper';

/**
 * NotificationPreference Prisma Repository
 */
export class NotificationPreferencePrismaRepository implements INotificationPreferenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(preference: NotificationPreference): Promise<void> {
    const { dto, enabled, channels, categories } =
      NotificationPreferencePrismaMapper.toPersistence(preference);

    await this.prisma.notificationPreference.upsert({
      where: { identityId: String(dto.identityId) },
      create: {
        id: String(dto.id),
        identityId: String(dto.identityId),
        enabled,
        channels,
        categories,
        version: dto.version,
        deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      },
      update: {
        enabled,
        channels,
        categories,
        version: dto.version,
        deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      },
    });
  }

  async findById(id: string): Promise<NotificationPreference | null> {
    const row = await this.prisma.notificationPreference.findUnique({
      where: { id },
    });
    if (!row) return null;
    return NotificationPreferencePrismaMapper.toDomain(row as unknown as PrismaNotificationPreferenceRow);
  }

  async findByIdentityId(identityId: string): Promise<NotificationPreference | null> {
    const row = await this.prisma.notificationPreference.findUnique({
      where: { identityId },
    });
    if (!row) return null;
    return NotificationPreferencePrismaMapper.toDomain(row as unknown as PrismaNotificationPreferenceRow);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notificationPreference.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.notificationPreference.count({ where: { id } });
    return count > 0;
  }

  async existsForIdentity(identityId: string): Promise<boolean> {
    const count = await this.prisma.notificationPreference.count({ where: { identityId } });
    return count > 0;
  }

  async getOrCreate(identityId: string): Promise<NotificationPreference> {
    const existing = await this.findByIdentityId(identityId);
    if (existing) return existing;

    const now = new Date();
    const preference = NotificationPreference.load({
      id: generateUUID() as any,
      identityId: identityId as any,
      settings: new Map([
        ['task', [NotificationChannelType.InApp]],
        ['goal', [NotificationChannelType.InApp]],
        ['schedule', [NotificationChannelType.InApp]],
        ['reminder', [NotificationChannelType.InApp]],
        ['account', [NotificationChannelType.InApp]],
        ['system', [NotificationChannelType.InApp]],
      ]),
      version: 1,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await this.save(preference);
    return preference;
  }
}
