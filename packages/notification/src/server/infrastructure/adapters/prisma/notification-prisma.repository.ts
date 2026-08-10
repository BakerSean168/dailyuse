/**
 * Notification Prisma Repository.
 * 通知 Prisma 仓储。
 *
 * Prisma implementation of INotificationRepository.
 * INotificationRepository 的 Prisma 实现。
 */

import type { PrismaClient, Prisma } from '@memoflow/database';
import type { INotificationRepository } from '../../../domain';
import type { NotificationCategory, NotificationEventMap, NotificationStatus } from '@memoflow/contracts/notification';
import { Notification } from '../../../domain/aggregates/notification';
import { createTypedEventPublisher, eventBus, flushDomainEvents } from '@memoflow/utils/domain';
import {
  NotificationPrismaMapper,
  type PrismaNotificationWithRelations,
} from './mappers/notification-prisma.mapper';

import {
  NotificationOutboxDispatchInputSchema,
  type NotificationOutboxDispatchInput,
} from '@memoflow/contracts/reliable-messaging';

const notificationEventPublisher = createTypedEventPublisher<NotificationEventMap>(eventBus);

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
  constructor(
    private readonly prisma: PrismaClient,
    private readonly metricsService?: import('../../../domain/services/notification-metrics-service').NotificationMetricsService,
  ) {}

  async save(
    notification: Notification,
    outboxDispatches?: NotificationOutboxDispatchInput[],
  ): Promise<void> {
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
          navigationIntent: dto.navigationIntent ? JSON.stringify(dto.navigationIntent) : null,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
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
          navigationIntent: dto.navigationIntent ? JSON.stringify(dto.navigationIntent) : null,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
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
              attempts: channel.sendAttempts,
              sentAt: channel.sentAt ? new Date(channel.sentAt) : null,
              failedAt: channel.failedAt ? new Date(channel.failedAt) : null,
              error: channel.error ? JSON.stringify(channel.error) : null,
              response: channel.response ? JSON.stringify(channel.response) : null,
            },
            update: {
              channelType: channel.channelType,
              status: channel.status,
              recipient: channel.recipient,
              maxRetries: channel.maxRetries,
              retryCount: channel.sendAttempts,
              attempts: channel.sendAttempts,
              sentAt: channel.sentAt ? new Date(channel.sentAt) : null,
              failedAt: channel.failedAt ? new Date(channel.failedAt) : null,
              error: channel.error ? JSON.stringify(channel.error) : null,
              response: channel.response ? JSON.stringify(channel.response) : null,
            },
          });
        }
      }

      // 3. Save NotificationDispatchOutbox entries in the same transaction
      if (outboxDispatches && outboxDispatches.length > 0) {
        let insertedCount = 0;
        const now = new Date();
        for (const outboxInput of outboxDispatches) {
          const validatedInput = NotificationOutboxDispatchInputSchema.parse(outboxInput);
          const existing = await tx.notificationDispatchOutbox.findUnique({
            where: { idempotencyKey: validatedInput.idempotencyKey },
          });

          if (!existing) {
            // The aggregate being saved IS the notificationId: never parse the
            // occurrenceKey (W1 occurrenceKeys are `${templateId}:${time}`).
            const notificationId = String(dto.id);

            await tx.notificationDispatchOutbox.create({
              data: {
                id: validatedInput.operationId,
                identityId: validatedInput.identityId,
                notificationId,
                source: validatedInput.source,
                occurrenceKey: validatedInput.occurrenceKey,
                channel: validatedInput.channel,
                payloadJson: validatedInput.payloadJson,
                idempotencyKey: validatedInput.idempotencyKey,
                status: 'pending',
                attempt: 0,
                fencingToken: 0,
                createdAt: now,
                updatedAt: now,
              },
            });
            insertedCount++;
          }
        }
        if (insertedCount > 0 && this.metricsService) {
          this.metricsService.recordPersisted(insertedCount);
        }
      }
    });

    flushDomainEvents(notificationEventPublisher, notification);
  }

  async saveMany(notifications: Notification[]): Promise<void> {
    for (const notification of notifications) {
      await this.save(notification);
    }
  }

  async findChannelsByStatus(status: string, limit?: number): Promise<Notification[]> {
    const rows = await this.prisma.notification.findMany({
      where: {
        deletedAt: null,
        channels: { some: { status } },
      },
      include: INCLUDE_CHILDREN,
      take: limit,
    });
    return rows.map((row) =>
      NotificationPrismaMapper.toDomain(row as PrismaNotificationWithRelations),
    );
  }

  async findByIdForIdentity(
    identityId: string,
    id: string,
    options?: { includeChildren?: boolean },
  ): Promise<Notification | null> {
    const row = await this.prisma.notification.findFirst({
      where: { id, identityId },
      include: options?.includeChildren ? INCLUDE_CHILDREN : INCLUDE_CHANNELS,
    });
    if (!row) return null;
    return NotificationPrismaMapper.toDomain(row as PrismaNotificationWithRelations);
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

    return rows.map((row) => NotificationPrismaMapper.toDomain(row as PrismaNotificationWithRelations));
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

    return rows.map((row) => NotificationPrismaMapper.toDomain(row as PrismaNotificationWithRelations));
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

    return rows.map((row) => NotificationPrismaMapper.toDomain(row as PrismaNotificationWithRelations));
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

    return rows.map((row) => NotificationPrismaMapper.toDomain(row as PrismaNotificationWithRelations));
  }

  async findByRelatedEntity(
    identityId: string,
    relatedEntityType: string,
    relatedEntityId: string,
  ): Promise<Notification[]> {
    const rows = await this.prisma.notification.findMany({
      where: {
        identityId,
        relatedEntityType,
        relatedEntityId,
        deletedAt: null,
      },
      include: INCLUDE_CHANNELS,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => NotificationPrismaMapper.toDomain(row as PrismaNotificationWithRelations));
  }

  async delete(identityId: string, id: string): Promise<void> {
    const result = await this.prisma.notification.deleteMany({
      where: { id, identityId },
    });
    if (result.count !== 1) {
      throw new Error('Notification not found for the current identity.');
    }
  }

  async deleteMany(identityId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.notification.deleteMany({
      where: { id: { in: ids }, identityId },
    });
  }

  async softDelete(identityId: string, id: string): Promise<void> {
    const result = await this.prisma.notification.updateMany({
      where: { id, identityId },
      data: { deletedAt: new Date() },
    });
    if (result.count !== 1) {
      throw new Error('Notification not found for the current identity.');
    }
  }

  async exists(identityId: string, id: string): Promise<boolean> {
    const count = await this.prisma.notification.count({ where: { id, identityId } });
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

  async markManyAsRead(identityId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const now = new Date();
    await this.prisma.notification.updateMany({
      where: { id: { in: ids }, identityId },
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
