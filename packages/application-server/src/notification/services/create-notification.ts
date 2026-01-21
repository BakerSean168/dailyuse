/**
 * Create Notification Service
 *
 * 创建通知的应用服务
 */

import { NotificationDomainService } from '@dailyuse/domain-server/notification';
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
  NotificationRepository as INotificationRepository,
  NotificationRepository as INotificationTemplateRepository,
  INotificationPreferenceRepository,
} from '@dailyuse/domain-server/notification';
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

  /**
   * 获取服务单例
   */
  static getInstance(): CreateNotification {
    if (!CreateNotification.instance) {
      CreateNotification.instance = CreateNotification.createInstance();
    }
    return CreateNotification.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateNotification.instance = undefined as unknown as CreateNotification;
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
      const { SSEConnectionManager } = await import('../../interface/sseRoutes');
      const sseManager = SSEConnectionManager.getInstance();

      // 发送 notification:created 事件
      const createdSent = sseManager.sendMessage(accountUuid, 'notification:created', {
        notification: clientDTO,
        timestamp: new Date().toISOString(),
      });

      if (createdSent) {
        logger.info('📡 [SSE推送] notification:created 事件已发送', {
          accountUuid,
          notificationUuid: clientDTO.uuid,
        });
      }

      // 根据 channels 发送特定事件
      if (channels && channels.length > 0) {
        const notificationData = {
          notification: clientDTO,
          timestamp: new Date().toISOString(),
        };

        if (channels.includes(ChannelTypeEnum.IN_APP)) {
          sseManager.sendMessage(accountUuid, 'notification:popup-reminder', notificationData);
          sseManager.sendMessage(
            accountUuid,
            'notification:system-notification',
            notificationData,
          );
        }

        if (channels.includes(ChannelTypeEnum.PUSH)) {
          sseManager.sendMessage(
            accountUuid,
            'notification:system-notification',
            notificationData,
          );
        }

        if (clientDTO.metadata?.sound) {
          sseManager.sendMessage(accountUuid, 'notification:sound-reminder', {
            ...notificationData,
            sound: clientDTO.metadata.sound,
          });
        }
      }

      if (!createdSent) {
        logger.warn('⚠️ [SSE推送] 用户未连接SSE', {
          accountUuid,
          notificationUuid: clientDTO.uuid,
        });
      }
    } catch (error) {
      logger.error('❌ [SSE推送] SSE 推送失败', {
        error: error instanceof Error ? error.message : String(error),
        accountUuid,
      });
    }
  }
}

/**
 * 便捷函数：创建通知
 */
export const createNotification = (params: Parameters<CreateNotification['execute']>[0]): Promise<NotificationClientDTO> =>
  CreateNotification.getInstance().execute(params);
