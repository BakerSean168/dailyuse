/**
 * Create Notification Service
 *
 * 创建通知的应用服务
 */

import { NotificationPolicy } from '../../../domain/services/notification-policy';
import { createLogger } from '@memoflow/utils/logger';
import type {
  NotificationClientDTO,
  NotificationType,
  NotificationCategory,
  RelatedEntityType,
  NotificationChannelType,
  NotificationNavigationIntentDTO,
} from '@memoflow/contracts/notification';
import { NotificationChannelType as ChannelTypeEnum } from '@memoflow/contracts/notification';
import type { IdentityId } from '@memoflow/contracts/primitives';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type {
  INotificationRepository,
  INotificationTemplateRepository,
  INotificationPreferenceRepository,
  NotificationOutboxDispatchPlan,
} from '../../../domain/repositories';
import type { NotificationDeliveryDecision } from '../../../domain/services/notification-policy';
import { randomUUID } from 'crypto';
import {
  buildIdempotencyKeyString,
} from '@memoflow/contracts/reliable-messaging';
import { toNotificationClientDTO } from './notification-dto-converters';
import { Notification } from '../../../domain/aggregates/notification';
import { NotificationChannel } from '../../../domain/entities/notification-channel';

const logger = createLogger('CreateNotificationUseCase');

/**
 * Create Notification Use Case
 */
export class CreateNotificationUseCase {
  private readonly policy: NotificationPolicy;
  private readonly closureChecker: (identityId: string) => Promise<boolean>;

  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly templateRepository: INotificationTemplateRepository,
    private readonly preferenceRepository: INotificationPreferenceRepository,
    closureChecker?: (identityId: string) => Promise<boolean>,
    private readonly clock: () => Date = () => new Date(),
  ) {
    if (!closureChecker) {
      throw new Error('[FAIL-CLOSED] CreateNotificationUseCase requires closureChecker');
    }
    this.closureChecker = closureChecker;
    this.policy = new NotificationPolicy();
  }

  async execute(params: {
    identityId: string;
    title: string;
    content: string;
    type: NotificationType;
    category: NotificationCategory;
    relatedEntityType?: RelatedEntityType;
    relatedEntityId?: string;
    /** R3d：稳定导航意图（点击通知跳转目标）。 */
    navigationIntent?: NotificationNavigationIntentDTO | null;
    channels?: NotificationChannelType[];
    expiresAt?: number | null;
    /** DND bypass is never inferred from type/category; callers must opt in explicitly. */
    bypassDoNotDisturb?: boolean;
  }): Promise<Result<NotificationClientDTO>> {
    if (await this.closureChecker(params.identityId)) {
      return error('FORBIDDEN', 'Account is closed or closure in progress');
    }
    logger.info('📬 [应用服务] 接收创建通知请求', {
      identityId: params.identityId,
      title: params.title,
      type: params.type,
      category: params.category,
    });

    const preference = await this.preferenceRepository.findByIdentityId(params.identityId);
    const channels = params.channels ?? [ChannelTypeEnum.InApp];
    const now = this.clock();

    // Notification is the durable user-visible Fact. Delivery policy is evaluated
    // independently per channel below and must never erase read/unread truth.
    const notification = Notification.create({
      identityId: params.identityId as IdentityId,
      title: params.title,
      content: params.content,
      type: params.type,
      category: params.category,
      navigationIntent: params.navigationIntent ?? null,
      expiresAt: params.expiresAt,
    });

    const outboxDispatches: NotificationOutboxDispatchPlan[] = [];
    const deliveryDecisions: NotificationDeliveryDecision[] = [];

    for (const channelType of channels) {
      const rateLimitUsage = preference?.rateLimit?.enabled
        ? await this.notificationRepository.getDeliveryUsage(
            params.identityId,
            params.category,
            channelType,
            now,
          )
        : undefined;
      const decision = this.policy.evaluate({
        category: params.category,
        channel: channelType,
        preference,
        doNotDisturb: preference?.doNotDisturb,
        rateLimit: preference?.rateLimit,
        rateLimitUsage,
        now,
        bypassDoNotDisturb: params.bypassDoNotDisturb === true,
      });
      deliveryDecisions.push(decision);

      if (decision.outcome === 'suppressed' || decision.outcome === 'rate_limited') {
        continue;
      }
      if (decision.outcome === 'deferred' && !decision.retryAt) {
        logger.warn('DND decision has no retryAt; keeping delivery suppressed rather than enqueueing immediately', {
          identityId: params.identityId,
          channelType,
        });
        continue;
      }
      const channel = NotificationChannel.create({
        notificationId: notification.id,
        channelType,
        recipient: params.identityId,
      });
      notification.addChannel(channel);

      const occurrenceKey = `${notification.id}:${channelType}`;
      const idempotencyKey = buildIdempotencyKeyString({
        identityId: params.identityId,
        source: 'notification',
        occurrenceKey,
      });

      outboxDispatches.push({
        operationId: randomUUID(),
        identityId: params.identityId,
        source: 'notification',
        occurrenceKey,
        channel: channelType,
        payloadJson: JSON.stringify({
          notificationId: String(notification.id),
          title: params.title,
          content: params.content,
          type: params.type,
          category: params.category,
          channelType,
          navigationIntent: params.navigationIntent ?? null,
        }),
        idempotencyKey,
        ...(decision.outcome === 'deferred' ? { deferUntil: decision.retryAt } : {}),
      });
    }

    notification.send();
    await this.notificationRepository.save(notification, outboxDispatches, deliveryDecisions);
    const clientDTO = toNotificationClientDTO(notification.toServerDTO());

    logger.info('✅✅✅ [应用服务] 通知创建完成', {
      notificationId: clientDTO.id,
      identityId: clientDTO.identityId,
      title: clientDTO.title,
      status: clientDTO.status,
    });

    return ok(clientDTO);
  }
}
