/**
 * Create Notification Service
 *
 * 创建通知的应用服务
 */

import { NotificationDomainService } from '../../domain-server/services/NotificationDomainService';
import { createLogger } from '@dailyuse/utils';
import type {
  NotificationServerDTO,
  NotificationClientDTO,
  CreateNotificationRequest,
  NotificationType,
  NotificationCategory,
  RelatedEntityType,
  NotificationChannelType,
} from '@dailyuse/contracts/notification';
import { NotificationChannelType as ChannelTypeEnum } from '@dailyuse/contracts/notification';
import type {
  INotificationRepository,
  INotificationTemplateRepository,
  INotificationPreferenceRepository,
} from '../../domain-server/repositories';
import { toNotificationClientDTO } from './notification-dto-converters';

const logger = createLogger('CreateNotification');

/**
 * Create Notification Service
 */
export class CreateNotification {
  private domainService: NotificationDomainService;

  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly templateRepository: INotificationTemplateRepository,
    private readonly preferenceRepository: INotificationPreferenceRepository,
  ) {
    this.domainService = new NotificationDomainService(
      notificationRepository,
      templateRepository,
      preferenceRepository,
    );
  }

  async execute(params: {
    accountUuid: string;
    title: string;
    content: string;
    type: NotificationType;
    category: NotificationCategory;
    relatedEntityType?: RelatedEntityType;
    relatedEntityUuid?: string;
    channels?: NotificationChannelType[];
  }): Promise<NotificationClientDTO> {
    logger.info('📬 [应用服务] 接收创建通知请求', {
      accountUuid: params.accountUuid,
      title: params.title,
      type: params.type,
      category: params.category,
    });

    const notification = await this.domainService.createAndSendNotification(params);
    const clientDTO = toNotificationClientDTO(notification.toServerDTO());

    logger.info('✅✅✅ [应用服务] 通知创建完成', {
      notificationUuid: clientDTO.uuid,
      accountUuid: clientDTO.accountUuid,
      title: clientDTO.title,
      status: clientDTO.status,
    });

    // 推送 SSE 事件
    await this.pushSSEEvents(params.accountUuid, params.channels, clientDTO);

    return clientDTO;
  }

  private async pushSSEEvents(
    accountUuid: string,
    channels: NotificationChannelType[] | undefined,
    clientDTO: NotificationClientDTO,
  ): Promise<void> {
    try {
      // TODO: Implement SSE notification delivery via event bus
      // The SSE mechanism should be handled by the infrastructure layer
      // This ensures application layer doesn't depend on infrastructure concerns
      logger.debug('📬 [应用服务] Notification queued for SSE delivery', {
        accountUuid,
        notificationUuid: clientDTO.uuid,
        channels,
      });
    } catch (error) {
      logger.error('❌ [SSE推送] SSE 推送失败', {
        error: error instanceof Error ? error.message : String(error),
        accountUuid,
      });
    }
  }
}
