/**
 * Notification Prisma Repository
 *
 * Prisma implementation of INotificationRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 *
 * Mapping notes:
 * - Domain Notification.notificationChannels → Prisma channels relation
 * - Domain NotificationChannel.sendAttempts → Prisma retryCount
 * - Domain uses typed IDs (branded strings) → Prisma uses plain String
 * - Prisma has `urgency` field mapped to importance for compatibility
 */

import type { PrismaClient, Prisma } from '@dailyuse/database';
import type { INotificationRepository } from '../../../domain-server';
import type { AppEventRegistry } from '@dailyuse/contracts/shared';
import type {
  NotificationCategory,
  NotificationStatus,
  NotificationChannelType,
  ChannelStatus,
  NotificationActionDTO,
  NotificationMetadataDTO,
} from '@dailyuse/contracts/notification';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import { Notification } from '../../../domain-server/aggregates/notification';
import { NotificationChannel } from '../../../domain-server/entities/notification-channel';
import { NotificationHistory } from '../../../domain-server/entities/notification-history';
import {
  NotificationId,
  NotificationChannelId,
  NotificationAction,
  NotificationMetadata,
  ChannelError,
  ChannelResponse,
} from '../../../domain-shared/value-objects';
import { eventBus } from '@dailyuse/utils';

// ============================================================
// Type definitions for Prisma query results
// ============================================================

type PrismaNotification = {
  id: string;
  identityId: string;
  title: string;
  content: string;
  type: string;
  category: string;
  importance: string;
  urgency: string;
  status: string;
  isRead: boolean;
  readAt: Date | null;
  sentAt: Date | null;
  expiresAt: Date | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  metadata: string | null;
  actions: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type PrismaNotificationChannel = {
  id: string;
  identityId: string;
  notificationId: string;
  channelType: string;
  status: string;
  recipient: string | null;
  maxRetries: number;
  retryCount: number;
  error: string | null;
  response: string | null;
};

type PrismaNotificationHistory = {
  id: string;
  identityId: string;
  notificationId: string;
  action: string;
  details: string | null;
  actorId: string | null;
  createdAt: Date;
};

type PrismaNotificationWithRelations = PrismaNotification & {
  channels?: PrismaNotificationChannel[];
  history?: PrismaNotificationHistory[];
};

// ============================================================
// Mappers: Prisma → Domain
// ============================================================

function parseJsonSafe<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function mapPrismaChannelToDomain(row: PrismaNotificationChannel): NotificationChannel {
  return NotificationChannel.load({
    id: NotificationChannelId.of(row.id),
    notificationId: NotificationId.of(row.notificationId),
    channelType: row.channelType as NotificationChannelType,
    status: row.status as ChannelStatus,
    recipient: row.recipient,
    sendAttempts: row.retryCount,
    maxRetries: row.maxRetries,
    error: row.error ? ChannelError.fromDTO(parseJsonSafe(row.error)!) : null,
    response: row.response ? ChannelResponse.fromDTO(parseJsonSafe(row.response)!) : null,
    sentAt: null,
    failedAt: null,
  });
}

function mapPrismaHistoryToDomain(row: PrismaNotificationHistory): NotificationHistory {
  return NotificationHistory.load({
    id: row.id as any,
    notificationId: row.notificationId as any,
    action: row.action,
    details: parseJsonSafe(row.details),
    createdAt: row.createdAt,
  });
}

function mapPrismaNotificationToDomain(row: PrismaNotificationWithRelations): Notification {
  const actions = parseJsonSafe<NotificationActionDTO[]>(row.actions);
  const metadata = parseJsonSafe<NotificationMetadataDTO>(row.metadata);

  return Notification.load({
    id: NotificationId.of(row.id),
    identityId: row.identityId as any,
    title: row.title,
    content: row.content,
    type: row.type as any,
    category: row.category as NotificationCategory,
    importance: (row.importance || 'Moderate') as ImportanceLevel,
    status: row.status as NotificationStatus,
    isRead: row.isRead,
    readAt: row.readAt ? row.readAt.getTime() : null,
    actions: actions ? actions.map((a) => NotificationAction.fromDTO(a)) : null,
    metadata: metadata ? NotificationMetadata.fromDTO(metadata) : null,
    version: row.version,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    notificationChannels: row.channels ? row.channels.map(mapPrismaChannelToDomain) : [],
  });
}

// ============================================================
// Include presets
// ============================================================

const INCLUDE_CHILDREN = {
  channels: true,
  history: true,
};

const INCLUDE_CHANNELS = {
  channels: true,
};

/**
 * Notification Prisma Repository
 */
export class NotificationPrismaRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(notification: Notification): Promise<void> {
    const dto = notification.toServerDTO();

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Upsert the Notification aggregate root
      await tx.notification.upsert({
        where: { id: String(dto.id) },
        create: {
          id: String(dto.id),
          identityId: String(dto.identityId),
          title: dto.title,
          content: dto.content,
          type: dto.type,
          category: dto.category,
          importance: dto.importance,
          urgency: dto.importance,
          status: dto.status,
          isRead: dto.isRead,
          readAt: dto.readAt ? new Date(dto.readAt) : null,
          metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
          actions: dto.actions ? JSON.stringify(dto.actions) : null,
          version: dto.version,
          deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
        },
        update: {
          title: dto.title,
          content: dto.content,
          type: dto.type,
          category: dto.category,
          importance: dto.importance,
          urgency: dto.importance,
          status: dto.status,
          isRead: dto.isRead,
          readAt: dto.readAt ? new Date(dto.readAt) : null,
          metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
          actions: dto.actions ? JSON.stringify(dto.actions) : null,
          version: dto.version,
          deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
          updatedAt: new Date(),
        },
      });

      // 2. Sync NotificationChannels: delete removed + upsert remaining
      if (dto.notificationChannels) {
        const currentChannelIds = dto.notificationChannels.map((c) => String(c.id));

        // Delete channels that no longer exist in the aggregate
        await tx.notificationChannel.deleteMany({
          where: {
            notificationId: String(dto.id),
            id: { notIn: currentChannelIds },
          },
        });

        // Upsert each channel
        for (const channel of dto.notificationChannels) {
          await tx.notificationChannel.upsert({
            where: { id: String(channel.id) },
            create: {
              id: String(channel.id),
              identityId: String(dto.identityId),
              notificationId: String(dto.id),
              channelType: channel.channelType,
              status: channel.status,
              recipient: channel.recipient,
              maxRetries: channel.maxRetries,
              retryCount: channel.sendAttempts,
              error: channel.error ? JSON.stringify(channel.error) : null,
              response: channel.response ? JSON.stringify(channel.response) : null,
            },
            update: {
              channelType: channel.channelType,
              status: channel.status,
              recipient: channel.recipient,
              maxRetries: channel.maxRetries,
              retryCount: channel.sendAttempts,
              error: channel.error ? JSON.stringify(channel.error) : null,
              response: channel.response ? JSON.stringify(channel.response) : null,
            },
          });
        }
      }
    });

    for (const event of notification.pullDomainEvents()) {
      const eventType = event.eventType as keyof AppEventRegistry;
      eventBus.send(eventType, event.payload as AppEventRegistry[typeof eventType]);
    }
  }

  async saveMany(notifications: Notification[]): Promise<void> {
    for (const notification of notifications) {
      await this.save(notification);
    }
  }

  async findById(
    id: string,
    options?: { includeChildren?: boolean },
  ): Promise<Notification | null> {
    const row = await this.prisma.notification.findUnique({
      where: { id },
      include: options?.includeChildren ? INCLUDE_CHILDREN : INCLUDE_CHANNELS,
    });
    if (!row) return null;
    return mapPrismaNotificationToDomain(row as PrismaNotificationWithRelations);
  }

  async findByIdentityId(
    identityId: string,
    options?: {
      includeChildren?: boolean;
      includeRead?: boolean;
      includeDeleted?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<Notification[]> {
    const where: Prisma.NotificationWhereInput = { identityId };

    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }
    if (options?.includeRead === false) {
      where.isRead = false;
    }

    const rows = await this.prisma.notification.findMany({
      where,
      include: options?.includeChildren ? INCLUDE_CHILDREN : INCLUDE_CHANNELS,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return rows.map((row) => mapPrismaNotificationToDomain(row as PrismaNotificationWithRelations));
  }

  async findByStatus(
    identityId: string,
    status: NotificationStatus,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    const rows = await this.prisma.notification.findMany({
      where: {
        identityId,
        status,
        deletedAt: null,
      },
      include: INCLUDE_CHANNELS,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return rows.map((row) => mapPrismaNotificationToDomain(row as PrismaNotificationWithRelations));
  }

  async findByCategory(
    identityId: string,
    category: NotificationCategory,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    const rows = await this.prisma.notification.findMany({
      where: {
        identityId,
        category,
        deletedAt: null,
      },
      include: INCLUDE_CHANNELS,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return rows.map((row) => mapPrismaNotificationToDomain(row as PrismaNotificationWithRelations));
  }

  async findUnread(identityId: string, options?: { limit?: number }): Promise<Notification[]> {
    const rows = await this.prisma.notification.findMany({
      where: {
        identityId,
        isRead: false,
        deletedAt: null,
      },
      include: INCLUDE_CHANNELS,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
    });

    return rows.map((row) => mapPrismaNotificationToDomain(row as PrismaNotificationWithRelations));
  }

  async findByRelatedEntity(
    relatedEntityType: string,
    relatedEntityId: string,
  ): Promise<Notification[]> {
    const rows = await this.prisma.notification.findMany({
      where: {
        relatedEntityType,
        relatedEntityId,
        deletedAt: null,
      },
      include: INCLUDE_CHANNELS,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => mapPrismaNotificationToDomain(row as PrismaNotificationWithRelations));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notification.delete({ where: { id } });
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.notification.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.notification.count({ where: { id } });
    return count > 0;
  }

  async countUnread(identityId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        identityId,
        isRead: false,
        deletedAt: null,
      },
    });
  }

  async countByCategory(identityId: string): Promise<Record<NotificationCategory, number>> {
    const rows = await this.prisma.notification.groupBy({
      by: ['category'],
      where: {
        identityId,
        deletedAt: null,
      },
      _count: { id: true },
    });

    const counts = {
      Task: 0,
      Goal: 0,
      Schedule: 0,
      Reminder: 0,
      Account: 0,
      System: 0,
      Other: 0,
    } as Record<NotificationCategory, number>;

    for (const row of rows) {
      counts[row.category as NotificationCategory] = row._count.id;
    }

    return counts;
  }

  async markManyAsRead(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const now = new Date();
    await this.prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: {
        isRead: true,
        status: 'Read',
        readAt: now,
        updatedAt: now,
      },
    });
  }

  async markAllAsRead(identityId: string): Promise<void> {
    const now = new Date();
    await this.prisma.notification.updateMany({
      where: {
        identityId,
        isRead: false,
        deletedAt: null,
      },
      data: {
        isRead: true,
        status: 'Read',
        readAt: now,
        updatedAt: now,
      },
    });
  }

  async cleanupExpired(beforeTimestamp: number): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        deletedAt: null,
        expiresAt: {
          not: null,
          lt: new Date(beforeTimestamp),
        },
      },
    });
    return result.count;
  }

  async cleanupDeleted(beforeTimestamp: number): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        deletedAt: {
          not: null,
          lt: new Date(beforeTimestamp),
        },
      },
    });
    return result.count;
  }
}
