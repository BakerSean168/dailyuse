import { describe, expect, it, vi } from 'vitest';
import { ChannelStatus } from '@memoflow/contracts/notification';
import {
  createNotificationRuntimeContribution,
  type NotificationChannelDeliverer,
  type NotificationRuntimeDeps,
} from './notification.runtime';
import { Notification } from '../../domain/aggregates/notification';
import { NotificationChannel } from '../../domain/entities/notification-channel';
import type { INotificationRepository } from '../../domain/repositories/i-notification-repository';

/** 构造一个带指定渠道状态的最小 Notification 聚合（经 Notification.load）。 */
function notificationWithChannel(status: string, options: { attempts?: number; failedAt?: Date | null } = {}) {
  const channel = NotificationChannel.create({
    notificationId: 'n-1' as never,
    channelType: 'InApp',
    recipient: 'identity-1',
  });
  // 通过内部状态直接摆好渠道状态（单测白盒，避免走实体状态机限制）
  const state: Record<string, unknown> = {
    id: 'ch-1',
    notificationId: 'n-1',
    channelType: 'InApp',
    status,
    recipient: 'identity-1',
    sendAttempts: options.attempts ?? 0,
    maxRetries: 3,
    error: null,
    response: null,
    sentAt: null,
    failedAt: options.failedAt ?? null,
  };
  Object.assign(channel, { _props: state });
  const notification = Notification.load({
    id: 'n-1' as never,
    identityId: 'identity-1' as never,
    title: 't',
    content: 'c',
    type: 'InApp' as never,
    category: 'Reminder' as never,
    importance: 'Moderate' as never,
    status: 'Unread' as never,
    isRead: false,
    readAt: null,
    actions: null,
    metadata: null,
    navigationIntent: null,
    expiresAt: null,
    version: 1,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    notificationChannels: [channel],
  } as never);
  return notification;
}

function makeRepository(notifications: Notification[]) {
  return {
    findChannelsByStatus: vi.fn(async (status: string) =>
      notifications.filter((n) =>
        (n.notificationChannels ?? []).some((c) => c.status === status),
      ),
    ),
    save: vi.fn(async () => undefined),
  } as unknown as INotificationRepository;
}

/** 等待 worker 首轮 tick 完成（首轮在 start 内立即执行）。 */
async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('NotificationChannel worker (R3 收尾)', () => {
  it('delivers pending channels and advances to Delivered with receipt', async () => {
    const notification = notificationWithChannel(ChannelStatus.Pending);
    const repository = makeRepository([notification]);
    const deliverer: NotificationChannelDeliverer = { deliver: vi.fn(async () => undefined) };

    const runtime = createNotificationRuntimeContribution({
      repository,
      deliverer,
      pollIntervalMs: 60_000,
    } as NotificationRuntimeDeps);
    runtime.start();
    await flush();
    runtime.stop();

    const channel = notification.notificationChannels![0];
    expect(deliverer.deliver).toHaveBeenCalledTimes(1);
    expect(channel.status).toBe(ChannelStatus.Delivered);
    expect(channel.sentAt).not.toBeNull();
    expect(repository.save).toHaveBeenCalled();
  });

  it('marks failed channels with backoff window and retries them later', async () => {
    const notification = notificationWithChannel(ChannelStatus.Failed, {
      attempts: 1,
      failedAt: new Date(Date.now() - 100_000), // 早已过退避窗口
    });
    const repository = makeRepository([notification]);

    const runtime = createNotificationRuntimeContribution({
      repository,
      deliverer: { deliver: vi.fn(async () => undefined) },
      pollIntervalMs: 60_000,
      backoffBaseMs: 5_000,
    } as NotificationRuntimeDeps);
    runtime.start();
    await flush();
    runtime.stop();

    const channel = notification.notificationChannels![0];
    expect(channel.status).toBe(ChannelStatus.Pending); // retry 回到 PENDING
  });

  it('keeps failed channels in dead-letter once attempts exceed the threshold', async () => {
    const notification = notificationWithChannel(ChannelStatus.Failed, {
      attempts: 3, // >= deadLetterThreshold(3) → canRetry false
      failedAt: new Date(Date.now() - 100_000),
    });
    const repository = makeRepository([notification]);

    const runtime = createNotificationRuntimeContribution({
      repository,
      deliverer: { deliver: vi.fn(async () => undefined) },
      pollIntervalMs: 60_000,
      deadLetterThreshold: 3,
    } as NotificationRuntimeDeps);
    runtime.start();
    await flush();
    runtime.stop();

    const channel = notification.notificationChannels![0];
    expect(channel.status).toBe(ChannelStatus.Failed); // 保持终态
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('marks delivery failure and does not crash the tick', async () => {
    const notification = notificationWithChannel(ChannelStatus.Pending);
    const repository = makeRepository([notification]);
    const deliverer: NotificationChannelDeliverer = {
      deliver: vi.fn(async () => {
        throw new Error('channel unreachable');
      }),
    };

    const runtime = createNotificationRuntimeContribution({
      repository,
      deliverer,
      pollIntervalMs: 60_000,
    } as NotificationRuntimeDeps);
    runtime.start();
    await flush();
    runtime.stop();

    const channel = notification.notificationChannels![0];
    expect(channel.status).toBe(ChannelStatus.Failed);
    expect(channel.failedAt).not.toBeNull();
  });
});
