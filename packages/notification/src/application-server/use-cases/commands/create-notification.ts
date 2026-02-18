/**
 * Create Notification Service
 *
 * 创建通知的应用服务
 */

import { NotificationPolicy } from '../../../domain-server/services/NotificationPolicy';
import { createLogger } from '@dailyuse/utils';
import type {
  NotificationServerDTO,
  NotificationClientDTO,
  NotificationType,
  NotificationCategory,
  RelatedEntityType,
  NotificationChannelType,
} from '@dailyuse/contracts/notification';
import { NotificationChannelType as ChannelTypeEnum } from '@dailyuse/contracts/notification';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import type {
  INotificationRepository,
  INotificationTemplateRepository,
  INotificationPreferenceRepository,
} from '../../../domain-server/repositories';
import { toNotificationClientDTO } from './notification-dto-converters';
import { Notification } from '../../../domain-server/aggregates/notification';
import { NotificationChannel } from '../../../domain-server/entities/notification-channel';

const logger = createLogger('CreateNotification');

/**
 * Create Notification Service
 */
export class CreateNotification {
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
    channels?: NotificationChannelType[];
  }): Promise<NotificationClientDTO> {
    logger.info('📬 [应用服务] 接收创建通知请求', {
      identityId: params.identityId,
      title: params.title,
      type: params.type,
      category: params.category,
    });

    const preference = await this.preferenceRepository.findByIdentityId(params.identityId);
    const channels = params.channels ?? [ChannelTypeEnum.InApp];

    this.policy.assertCanSend({
      category: params.category,
      channel: channels[0],
      preference,
    });

    const notification = Notification.create({
      identityId: params.identityId as IdentityId,
      title: params.title,
      content: params.content,
      type: params.type,
      category: params.category,
    });

    for (const channelType of channels) {
      const channel = NotificationChannel.create({
        notificationId: notification.id,
        channelType,
        recipient: params.identityId,
      });
      notification.addChannel(channel);
    }

    await notification.send();
    await this.notificationRepository.save(notification);
    const clientDTO = toNotificationClientDTO(notification.toServerDTO());

    logger.info('✅✅✅ [应用服务] 通知创建完成', {
      notificationId: clientDTO.id,
      identityId: clientDTO.identityId,
      title: clientDTO.title,
      status: clientDTO.status,
    });

    // 推送 SSE 事件
    await this.pushSSEEvents(params.identityId, params.channels, clientDTO);

    return clientDTO;
  }

  private async pushSSEEvents(
    identityId: string,
    channels: NotificationChannelType[] | undefined,
    clientDTO: NotificationClientDTO,
  ): Promise<void> {
    try {
      // TODO: Implement SSE notification delivery via event bus
      // The SSE mechanism should be handled by the infrastructure layer
      // This ensures application layer doesn't depend on infrastructure concerns
      logger.debug('📬 [应用服务] Notification queued for SSE delivery', {
        identityId,
        notificationId: clientDTO.id,
        channels,
      });
    } catch (error) {
      logger.error('❌ [SSE推送] SSE 推送失败', {
        error: error instanceof Error ? error.message : String(error),
        identityId,
      });
    }
  }
}
