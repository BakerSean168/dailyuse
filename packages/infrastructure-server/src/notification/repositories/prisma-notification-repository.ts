// @ts-nocheck
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/shared/infrastructure/config/prisma';
import type { NotificationRepository as INotificationRepository } from '@dailyuse/domain-server/notification';
import { Notification, NotificationChannel, NotificationHistory } from '@dailyuse/domain-server/notification';
import type { NotificationServerDTO, NotificationPreferenceServerDTO } from '@dailyuse/contracts/notification';


/**
 * Notification 聚合根 Prisma 仓储实现
 * 负责 Notification 及其所有子实体的完整持久化
 *
 * 聚合根包含：
 * - Notification (主实体)
 * - NotificationChannel[] (子实体集合)
 * - NotificationHistory[] (子实体集合)
 * - NotificationAction[] (值对象，JSON存储)
 * - NotificationMetadata (值对象，JSON存储)
 */
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  private mapToEntity(data: any): Notification {
    const notification = Notification.fromPersistenceDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      title: data.title,
      content: data.content,
      type: data.type,
      category: data.category,
      importance: data.importance,
      urgency: data.urgency,
      status: data.status,
      isRead: data.isRead,
      readAt: data.readAt?.getTime() ?? null,
      relatedEntityType: data.relatedEntityType,
      relatedEntityUuid: data.relatedEntityUuid,
      actions: data.actions,
      metadata: data.metadata,
      expiresAt: data.expiresAt?.getTime() ?? null,
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
      sentAt: data.sentAt?.getTime() ?? null,
      deliveredAt: data.deliveredAt?.getTime() ?? null,
      deletedAt: data.deletedAt?.getTime() ?? null,
    });

    // 加载 NotificationChannel 子实体
    if (data.channels) {
      data.channels.forEach((channel: any) => {
        const channelEntity = NotificationChannel.fromPersistenceDTO({
          uuid: channel.uuid,
          notificationUuid: channel.notificationUuid,
          channelType: channel.channelType,
          recipient: channel.recipient,
          status: channel.status,
          sentAt: channel.sentAt?.getTime() ?? null,
          deliveredAt: channel.deliveredAt?.getTime() ?? null,
          failedAt: channel.failedAt?.getTime() ?? null,
          error: channel.error,
          sendAttempts: channel.retryCount,
          maxRetries: channel.maxRetries,
          response: channel.response,
          createdAt: channel.createdAt.getTime(),
        });
        notification.addChannel(channelEntity);
      });
    }

    // 加载 NotificationHistory 子实体
    if (data.history) {
      data.history.forEach((hist: any) => {
        notification.addHistory(hist.action, hist.details ? JSON.parse(hist.details) : null);
      });
    }

    return notification;
  }

  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  // ===== INotificationRepository 接口实现 =====

  async save(notification: Notification): Promise<void> {
    const persistence = notification.toPersistenceDTO();

    await this.prisma.$transaction(async (tx) => {
      // 1. Upsert Notification 主实体
      await tx.notification.upsert({
        where: { uuid: persistence.uuid },
        create: {
          uuid: persistence.uuid,
          accountUuid: persistence.accountUuid,
          title: persistence.title,
          content: persistence.content,
          type: persistence.type,
          category: persistence.category,
          importance: persistence.importance,
          urgency: persistence.urgency,
          status: persistence.status,
          isRead: persistence.isRead,
          readAt: this.toDate(persistence.readAt),
          relatedEntityType: persistence.relatedEntityType,
          relatedEntityUuid: persistence.relatedEntityUuid,
          actions: persistence.actions,
          metadata: persistence.metadata,
          expiresAt: this.toDate(persistence.expiresAt),
          createdAt: this.toDate(persistence.createdAt) ?? new Date(),
          updatedAt: this.toDate(persistence.updatedAt) ?? new Date(),
          sentAt: this.toDate(persistence.sentAt),
          deletedAt: this.toDate(persistence.deletedAt),
        },
        update: {
          title: persistence.title,
          content: persistence.content,
          type: persistence.type,
          category: persistence.category,
          importance: persistence.importance,
          urgency: persistence.urgency,
          status: persistence.status,
          isRead: persistence.isRead,
          readAt: this.toDate(persistence.readAt),
          relatedEntityType: persistence.relatedEntityType,
          relatedEntityUuid: persistence.relatedEntityUuid,
          actions: persistence.actions,
          metadata: persistence.metadata,
          expiresAt: this.toDate(persistence.expiresAt),
          updatedAt: this.toDate(persistence.updatedAt) ?? new Date(),
          sentAt: this.toDate(persistence.sentAt),
          deletedAt: this.toDate(persistence.deletedAt),
        },
      });

      // 2. Upsert NotificationChannel 子实体
      const channels = notification.getAllChannels();
      for (const channel of channels) {
        const channelPersistence = channel.toPersistenceDTO();
        await tx.notificationChannel.upsert({
          where: { uuid: channelPersistence.uuid },
          create: {
            uuid: channelPersistence.uuid,
            notificationUuid: persistence.uuid,
            channelType: channelPersistence.channelType,
            recipient: channelPersistence.recipient,
            status: channelPersistence.status,
            // Note: sentAt, deliveredAt, failedAt fields don't exist in Prisma schema
            error: channelPersistence.error,
            retryCount: channelPersistence.sendAttempts,
            maxRetries: channelPersistence.maxRetries,
            response: channelPersistence.response,
          },
          update: {
            status: channelPersistence.status,
            // Note: sentAt, deliveredAt, failedAt fields don't exist in Prisma schema
            error: channelPersistence.error,
            retryCount: channelPersistence.sendAttempts,
            response: channelPersistence.response,
          },
        });
      }

      // 3. Upsert NotificationHistory 子实体
      const history = notification.getHistory();
      for (const hist of history) {
        const histPersistence = hist.toPersistenceDTO();
        await tx.notificationHistory.upsert({
          where: { uuid: histPersistence.uuid },
          create: {
            uuid: histPersistence.uuid,
            notificationUuid: persistence.uuid,
            action: histPersistence.action,
            details: histPersistence.details,
            createdAt: this.toDate(histPersistence.createdAt) ?? new Date(),
          },
          update: {
            action: histPersistence.action,
            details: histPersistence.details,
          },
        });
      }
    });
  }

  async saveMany(notifications: Notification[]): Promise<void> {
    for (const notification of notifications) {
      await this.save(notification);
    }
  }

  async findById(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<Notification | null> {
    const data = await this.prisma.notification.findUnique({
      where: { uuid },
      include: options?.includeChildren
        ? {
            channels: true,
            history: true,
          }
        : undefined,
    });

    return data ? this.mapToEntity(data) : null;
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: {
      includeChildren?: boolean;
      includeRead?: boolean;
      includeDeleted?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<Notification[]> {
    const where: any = { accountUuid };

    if (options?.includeRead === false) {
      where.isRead = false;
    }

    if (options?.includeDeleted === false) {
      where.deletedAt = null;
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      include: options?.includeChildren
        ? {
            channels: true,
            history: true,
          }
        : undefined,
      skip: options?.offset,
      take: options?.limit,
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((n) => this.mapToEntity(n));
  }

  async findByStatus(
    accountUuid: string,
    status: NotificationStatus,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { accountUuid, status },
      skip: options?.offset,
      take: options?.limit,
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((n) => this.mapToEntity(n));
  }

  async findByCategory(
    accountUuid: string,
    category: NotificationCategory,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { accountUuid, category },
      skip: options?.offset,
      take: options?.limit,
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((n) => this.mapToEntity(n));
  }

  async findUnread(accountUuid: string, options?: { limit?: number }): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        accountUuid,
        isRead: false,
        deletedAt: null,
      },
      take: options?.limit,
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((n) => this.mapToEntity(n));
  }

  async findByRelatedEntity(
    relatedEntityType: string,
    relatedEntityUuid: string,
  ): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        relatedEntityType,
        relatedEntityUuid,
      },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((n) => this.mapToEntity(n));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.notificationHistory.deleteMany({ where: { notificationUuid: uuid } });
      await tx.notificationChannel.deleteMany({ where: { notificationUuid: uuid } });
      await tx.notification.delete({ where: { uuid } });
    });
  }

  async deleteMany(uuids: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.notificationHistory.deleteMany({ where: { notificationUuid: { in: uuids } } });
      await tx.notificationChannel.deleteMany({ where: { notificationUuid: { in: uuids } } });
      await tx.notification.deleteMany({ where: { uuid: { in: uuids } } });
    });
  }

  async softDelete(uuid: string): Promise<void> {
    await this.prisma.notification.update({
      where: { uuid },
      data: { deletedAt: new Date() },
    });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.notification.count({ where: { uuid } });
    return count > 0;
  }

  async countUnread(accountUuid: string): Promise<number> {
    return await this.prisma.notification.count({
      where: {
        accountUuid,
        isRead: false,
        deletedAt: null,
      },
    });
  }

  async countByCategory(accountUuid: string): Promise<Record<NotificationCategory, number>> {
    const counts = await this.prisma.notification.groupBy({
      by: ['category'],
      where: { accountUuid },
      _count: true,
    });

    const result: any = {};
    counts.forEach((item) => {
      result[item.category] = item._count;
    });

    return result;
  }

  async markManyAsRead(uuids: string[]): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { uuid: { in: uuids } },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(accountUuid: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        accountUuid,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async cleanupExpired(beforeTimestamp: number): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        expiresAt: {
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
          lt: new Date(beforeTimestamp),
        },
      },
    });
    return result.count;
  }
}

