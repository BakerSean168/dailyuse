/**
 * Create Notification Service
 *
 * 创建通知的应用服务
 */

import { NotificationPolicy } from '../../../domain/services/notification-policy';
import { BusinessRuleViolationError } from '@memoflow/utils/errors';
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
} from '../../../domain/repositories';
import { randomUUID } from 'crypto';
import {
  buildIdempotencyKeyString,
  type NotificationOutboxDispatchInput,
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

  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly templateRepository: INotificationTemplateRepository,
    private readonly preferenceRepository: INotificationPreferenceRepository,
  ) {
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
  }): Promise<Result<NotificationClientDTO>> {
    logger.info('📬 [应用服务] 接收创建通知请求', {
      identityId: params.identityId,
      title: params.title,
      type: params.type,
      category: params.category,
    });

    const preference = await this.preferenceRepository.findByIdentityId(params.identityId);
    const channels = params.channels ?? [ChannelTypeEnum.InApp];

    try {
      this.policy.assertCanSend({
        category: params.category,
        channel: channels[0],
        preference,
      });
    } catch (err) {
      if (err instanceof BusinessRuleViolationError) {
        return error('FORBIDDEN', err.message);
      }
      throw err;
    }

    const notification = Notification.create({
      identityId: params.identityId as IdentityId,
      title: params.title,
      content: params.content,
      type: params.type,
      category: params.category,
      navigationIntent: params.navigationIntent ?? null,
      expiresAt: params.expiresAt,
    });

    const outboxDispatches: NotificationOutboxDispatchInput[] = [];

    for (const channelType of channels) {
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
      });
    }

    await notification.send();
    await this.notificationRepository.save(notification, outboxDispatches);
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
