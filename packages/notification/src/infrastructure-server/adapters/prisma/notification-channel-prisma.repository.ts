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

  /**
   * Serialize optional JSON field for database storage
   */
  private serializeJsonField(value: any | null): string | null {
    return value ? JSON.stringify(value) : null;
  }

  /**
   * Parse optional JSON field from database
   */
  private parseJsonField(value: string | null): any | null {
    return value ? JSON.parse(value) : null;
  }

  private mapToDTO(data: any): NotificationChannelServerDTO {
    return {
      id: data.id,
      notificationId: data.notificationId,
      channelType: data.channelType,
      status: data.status,
      recipient: data.recipient ?? null,
      sendAttempts: data.retryCount,
      maxRetries: data.maxRetries,
      error: this.parseJsonField(data.error),
      response: this.parseJsonField(data.response),
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

  private mapToPersistence(channel: NotificationChannelServerDTO) {
    return {
      id: channel.id,
      notificationId: channel.notificationId,
      channelType: channel.channelType,
      status: channel.status,
      recipient: channel.recipient,
      retryCount: channel.sendAttempts,
      maxRetries: channel.maxRetries,
      error: this.serializeJsonField(channel.error),
      response: this.serializeJsonField(channel.response),
    };
  }

  async save(channel: NotificationChannelServerDTO): Promise<void> {
    const persistence = this.mapToPersistence(channel);
    
    await this.prisma.notificationChannel.upsert({
      where: { id: channel.id },
      create: persistence,
      update: {
        status: persistence.status,
        recipient: persistence.recipient,
        retryCount: persistence.retryCount,
        maxRetries: persistence.maxRetries,
        error: persistence.error,
        response: persistence.response,
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
