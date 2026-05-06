/**
 * Create Notification Service
 *
 * 创建通知的应用服务
 */

import { NotificationPolicy } from '../../../domain-server/services/NotificationPolicy';
import { createLogger, eventBus, BusinessRuleViolationError } from '@dailyuse/utils';
import type {
  NotificationClientDTO,
  NotificationDispatchDesktopEvent,
  NotificationEventMap,
  NotificationType,
  NotificationCategory,
  RelatedEntityType,
  NotificationChannelType,
} from '@dailyuse/contracts/notification';
import { NotificationChannelType as ChannelTypeEnum } from '@dailyuse/contracts/notification';
import type { IdentityId, NotificationId } from '@dailyuse/contracts/primitives';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type {
  INotificationRepository,
  INotificationTemplateRepository,
  INotificationPreferenceRepository,
} from '../../../domain-server/repositories';
import { toNotificationClientDTO } from './notification-dto-converters';
import { Notification } from '../../../domain-server/aggregates/notification';
import { NotificationChannel } from '../../../domain-server/entities/notification-channel';

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
    channels?: NotificationChannelType[];
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

    return ok(clientDTO);
  }

  private async pushSSEEvents(
    identityId: string,
    channels: NotificationChannelType[] | undefined,
    clientDTO: NotificationClientDTO,
  ): Promise<void> {
    try {
      const resolvedChannels = channels ?? [ChannelTypeEnum.InApp];

      // Emit in-app dispatch event so the Vue client (and any other subscriber)
      // receives the notification in real-time via the shared event bus.
      if (resolvedChannels.includes(ChannelTypeEnum.InApp)) {
        const dispatchEvent: NotificationEventMap['notification:dispatch_in_app'] = {
          id: clientDTO.id,
          identityId: identityId as IdentityId,
          title: clientDTO.title,
          body: clientDTO.content,
          category: clientDTO.category,
          type: clientDTO.type,
          importance: clientDTO.importance,
          data: clientDTO.metadata ? { ...clientDTO.metadata } : undefined,
        };
        eventBus.send('notification:dispatch_in_app', dispatchEvent);
      }

      if (resolvedChannels.includes(ChannelTypeEnum.Push)) {
        const desktopEvent: NotificationDispatchDesktopEvent = {
          id: clientDTO.id,
          identityId: identityId as IdentityId,
          title: clientDTO.title,
          body: clientDTO.content,
          category: clientDTO.category,
          type: clientDTO.type,
          importance: clientDTO.importance,
          data: clientDTO.metadata ? { ...clientDTO.metadata } : undefined,
          sound: { enabled: true, name: null },
        };
        eventBus.send('notification:dispatch_desktop', desktopEvent);
      }

      logger.debug('📬 [应用服务] Notification dispatched via event bus', {
        identityId,
        notificationId: clientDTO.id,
        channels: resolvedChannels,
      });
    } catch (error) {
      // SSE delivery is best-effort — never let it fail the create operation.
      logger.error('❌ [SSE推送] SSE 推送失败', {
        error: error instanceof Error ? error.message : String(error),
        identityId,
      });
    }
  }
}
