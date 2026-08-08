import { createLogger } from '@memoflow/utils/logger';
import { ChannelStatus } from '@memoflow/contracts/notification';
import type { Notification } from '../../domain/aggregates/notification';
import { ChannelError } from '../../domain/value-objects/channel-error';
import type { INotificationRepository } from '../../domain/repositories/i-notification-repository';
import type { NotificationModuleRuntimeContribution } from '../notification.module';

const logger = createLogger('NotificationRuntime');

export const NOTIFICATION_CHANNEL_POLL_INTERVAL_MS = 2_000;
/** 指数退避基数（毫秒）：delay = baseDelay * 2^attempts */
export const NOTIFICATION_CHANNEL_BACKOFF_BASE_MS = 5_000;
export const NOTIFICATION_CHANNEL_DEAD_LETTER_THRESHOLD = 3;

export interface NotificationChannelDeliverer {
  /** 投递单个渠道；成功 resolve，失败 throw（worker 会标记 Failed 并安排重试）。 */
  deliver(notification: Notification, channel: NonNullable<Notification['notificationChannels']>[number]): Promise<void>;
}

type Channel = NonNullable<Notification['notificationChannels']>[number];

export interface NotificationRuntimeDeps {
  readonly repository: INotificationRepository;
  readonly deliverer?: NotificationChannelDeliverer;
  readonly pollIntervalMs?: number;
  readonly backoffBaseMs?: number;
  readonly deadLetterThreshold?: number;
}

/**
 * R3e：通知渠道 worker——PENDING 渠道的可靠投递执行者。
 *
 * - 轮询 PENDING 渠道 → 调 deliverer 投递 → 成功 `send + markAsDelivered`
 *   （记录 sentAt/receipt），失败 `markAsFailed`；
 * - 失败渠道在指数退避窗口过后 `retry()` 回到 PENDING 重新投递；
 * - attempts >= deadLetterThreshold 的失败渠道保持 Failed 终态（dead-letter，
 *   可人工介入），不再自动重试；
 * - 未注入 deliverer 时投递视为成功（只推进渠道状态，供读模型/统计使用）。
 */
export function createNotificationRuntimeContribution(
  deps?: NotificationRuntimeDeps,
): NotificationModuleRuntimeContribution {
  let started = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let flushing = false;

  const pollIntervalMs = deps?.pollIntervalMs ?? NOTIFICATION_CHANNEL_POLL_INTERVAL_MS;
  const backoffBaseMs = deps?.backoffBaseMs ?? NOTIFICATION_CHANNEL_BACKOFF_BASE_MS;
  const deliverer: NotificationChannelDeliverer = deps?.deliverer ?? {
    async deliver() {
      // 默认 no-op：未配置渠道适配器时仅推进渠道状态。
    },
  };

  const isInBackoffWindow = (channel: Channel): boolean => {
    if (!channel.failedAt) return false;
    const attempts = channel.sendAttempts;
    const backoffMs = backoffBaseMs * 2 ** Math.max(0, attempts - 1);
    return Date.now() - channel.failedAt.getTime() < backoffMs;
  };

  const tick = async (): Promise<void> => {
    if (flushing) return;
    flushing = true;
    try {
      if (!deps?.repository) {
        return;
      }
      // 1) PENDING：投递
      const pendingNotifications = await deps.repository.findChannelsByStatus(
        ChannelStatus.Pending,
        50,
      );
      for (const notification of pendingNotifications) {
        for (const channel of notification.notificationChannels ?? []) {
          if (channel.status !== ChannelStatus.Pending) continue;
          try {
            await deliverer.deliver(notification, channel);
            channel.send();
            channel.markAsDelivered();
            logger.info('[Notification] Channel delivered', {
              notificationId: String(notification.id),
              channelId: String(channel.id),
              channelType: channel.channelType,
            });
          } catch (error) {
            channel.markAsFailed(
              ChannelError.create({
                code: 'DELIVERY_FAILED',
                message: error instanceof Error ? error.message : String(error),
              }),
            );
            logger.error('[Notification] Channel delivery failed', {
              notificationId: String(notification.id),
              channelId: String(channel.id),
              attempts: channel.sendAttempts,
              error: error instanceof Error ? error.message : String(error),
            });
          }
          await deps.repository.save(notification);
        }
      }

      // 2) FAILED：退避窗口过后重试（dead-letter 终态不重试）
      const failedNotifications = await deps.repository.findChannelsByStatus(
        ChannelStatus.Failed,
        50,
      );
      for (const notification of failedNotifications) {
        for (const channel of notification.notificationChannels ?? []) {
          if (channel.status !== ChannelStatus.Failed) continue;
          if (!channel.canRetry()) continue; // dead-letter
          if (isInBackoffWindow(channel)) continue;
          channel.retry();
          await deps.repository.save(notification);
          logger.info('[Notification] Channel scheduled for retry', {
            notificationId: String(notification.id),
            channelId: String(channel.id),
            attempts: channel.sendAttempts,
          });
        }
      }
    } catch (error) {
      logger.error('[Notification] Channel worker tick failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      flushing = false;
    }
  };

  return {
    start(): void {
      if (started) return;
      started = true;
      void tick();
      timer = setInterval(() => void tick(), pollIntervalMs);
      timer.unref?.();
      logger.info('[Notification] Channel worker started', { pollIntervalMs });
    },

    stop(): void {
      if (!started) return;
      started = false;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      logger.info('[Notification] Channel worker stopped');
    },
  };
}
