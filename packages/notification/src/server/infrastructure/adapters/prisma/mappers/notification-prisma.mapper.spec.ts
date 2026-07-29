import { describe, expect, it } from 'vitest';
import { ChannelStatus, NotificationChannelType } from '@memoflow/contracts/notification';
import {
  NotificationPrismaMapper,
  type PrismaNotificationChannelRow,
} from './notification-prisma.mapper';

describe('NotificationPrismaMapper', () => {
  it('maps the channel row id independently from its parent notification id', () => {
    const row: PrismaNotificationChannelRow = {
      id: 'INotificationChannelId_550e8400-e29b-41d4-a716-446655440001',
      identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440003',
      notificationId: 'INotificationId_550e8400-e29b-41d4-a716-446655440002',
      channelType: NotificationChannelType.InApp,
      status: ChannelStatus.Pending,
      recipient: null,
      maxRetries: 3,
      retryCount: 0,
      error: null,
      response: null,
    };

    const channel = NotificationPrismaMapper.channelToDomain(row).toServerDTO();

    expect(channel.id).toBe(row.id);
    expect(channel.notificationId).toBe(row.notificationId);
    expect(channel.id).not.toBe(channel.notificationId);
  });
});
