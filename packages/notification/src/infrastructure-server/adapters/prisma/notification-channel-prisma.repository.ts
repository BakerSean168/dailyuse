/**
 * NotificationChannelPrismaRepository
 * Prisma implementation of INotificationChannelRepository
 *
 * 通知渠道仓储 - Prisma实现
 */

import type { PrismaClient } from '@dailyuse/database';
import type { INotificationChannelRepository } from '../../../domain-server/repositories/INotificationChannelRepository';
import type { NotificationChannelServerDTO } from '@dailyuse/contracts/notification';

export class NotificationChannelPrismaRepository
  implements INotificationChannelRepository
{
  constructor(private prisma: PrismaClient) {}

  private mapToDTO(data: any): NotificationChannelServerDTO {
    return {
      id: data.id,
      notificationId: data.notificationId,
      channelType: data.channelType,
      status: data.status,
      recipient: data.recipient ?? null,
      sendAttempts: data.retryCount ?? 0,
      maxRetries: data.maxRetries,
      error: data.error ? JSON.parse(data.error) : null,
      response: data.response ? JSON.parse(data.response) : null,
      createdAt: data.createdAt instanceof Date
        ? data.createdAt.toISOString()
        : data.createdAt,
      sentAt: data.sentAt
        ? data.sentAt instanceof Date
          ? data.sentAt.toISOString()
          : data.sentAt
        : null,
      failedAt: data.failedAt
        ? data.failedAt instanceof Date
          ? data.failedAt.toISOString()
          : data.failedAt
        : null,
    };
  }

  async save(channel: NotificationChannelServerDTO): Promise<void> {
    await this.prisma.notificationChannel.upsert({
      where: { id: channel.id },
      create: {
        id: channel.id,
        notificationId: channel.notificationId,
        channelType: channel.channelType,
        status: channel.status,
        recipient: channel.recipient,
        retryCount: channel.sendAttempts,
        maxRetries: channel.maxRetries,
        error: channel.error ? JSON.stringify(channel.error) : null,
        response: channel.response ? JSON.stringify(channel.response) : null,
      },
      update: {
        status: channel.status,
        recipient: channel.recipient,
        retryCount: channel.sendAttempts,
        maxRetries: channel.maxRetries,
        error: channel.error ? JSON.stringify(channel.error) : null,
        response: channel.response ? JSON.stringify(channel.response) : null,
      },
    });
  }

  async findById(id: string): Promise<NotificationChannelServerDTO | null> {
    const data = await this.prisma.notificationChannel.findUnique({
      where: { id },
    });
    return data ? this.mapToDTO(data) : null;
  }

  async findByNotificationId(
    notificationId: string,
  ): Promise<NotificationChannelServerDTO[]> {
    const data = await this.prisma.notificationChannel.findMany({
      where: { notificationId },
      orderBy: { id: 'asc' },
    });
    return data.map((item: any) => this.mapToDTO(item));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notificationChannel.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.notificationChannel.count({
      where: { id },
    });
    return count > 0;
  }
}
