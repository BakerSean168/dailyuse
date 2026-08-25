/**
 * NotificationPreference Prisma Repository.
 * 通知偏好 Prisma 仓储。
 *
 * Prisma implementation of INotificationPreferenceRepository.
 * INotificationPreferenceRepository 的 Prisma 实现。
 */

import type { PrismaClient } from '@memoflow/database';
import type { INotificationPreferenceRepository } from '../../../domain';
import { NotificationPreference } from '../../../domain/aggregates/notification-preference';
import { NotificationChannelType } from '@memoflow/contracts/notification';
import { generateUUID } from '@memoflow/utils/shared';
import { NotificationPreferencePrismaMapper } from './mappers/notification-preference-prisma.mapper';

/**
 * NotificationPreference Prisma Repository
 */
export class NotificationPreferencePrismaRepository implements INotificationPreferenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(preference: NotificationPreference): Promise<void> {
    const { dto, enabled, channels, categories, doNotDisturb, rateLimit } =
      NotificationPreferencePrismaMapper.toPersistence(preference);

    await this.prisma.notificationPreference.upsert({
      where: { identityId: String(dto.identityId) },
      create: {
        id: String(dto.id),
        identityId: String(dto.identityId),
        enabled,
        channels,
        categories,
        doNotDisturb,
        rateLimit,
        version: dto.version,
        deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      },
      update: {
        enabled,
        channels,
        categories,
        doNotDisturb,
        rateLimit,
        version: dto.version,
        deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      },
    });
  }

  async findByIdForIdentity(
    identityId: string,
    id: string,
  ): Promise<NotificationPreference | null> {
    const row = await this.prisma.notificationPreference.findFirst({
      where: { id, identityId },
    });
    if (!row) return null;
    return NotificationPreferencePrismaMapper.toDomain(row);
  }

  async findByIdentityId(identityId: string): Promise<NotificationPreference | null> {
    const row = await this.prisma.notificationPreference.findUnique({
      where: { identityId },
    });
    if (!row) return null;
    return NotificationPreferencePrismaMapper.toDomain(row);
  }

  async delete(identityId: string, id: string): Promise<void> {
    const result = await this.prisma.notificationPreference.deleteMany({
      where: { id, identityId },
    });
    if (result.count === 0) {
      throw new Error('Notification preference not found for the current identity.');
    }
  }

  async exists(identityId: string, id: string): Promise<boolean> {
    const count = await this.prisma.notificationPreference.count({
      where: { id, identityId },
    });
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
      id: generateUUID() as never,
      identityId: identityId as never,
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
