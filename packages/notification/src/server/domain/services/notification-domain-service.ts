/**
 * Notification 领域服务
 *
 * DDD 领域服务职责：
 * - 跨聚合根的业务逻辑
 * - 协调多个聚合根
 * - 使用仓储接口进行持久化
 * - 触发领域事件
 */

import type { INotificationRepository } from '../repositories/i-notification-repository';
import type { INotificationTemplateRepository } from '../repositories/i-notification-template-repository';
import type { INotificationPreferenceRepository } from '../repositories/i-notification-preference-repository';
import { Notification } from '../aggregates/notification';
import { NotificationChannel } from '../entities/notification-channel';
import type { NotificationActionDTO, NotificationMetadataDTO } from '@dailyuse/contracts/notification';
import { NotificationCategory, NotificationType, NotificationChannelType } from '@dailyuse/contracts/notification';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('NotificationDomainService');

/**
 * NotificationDomainService
 *
 * 注意：
 * - 通过构造函数注入仓储接口
 * - 不直接操作数据库
 * - 业务逻辑在聚合根/实体中，服务只是协调
 */
export class NotificationDomainService {
  constructor(
    private readonly notificationRepo: INotificationRepository,
    private readonly templateRepo: INotificationTemplateRepository,
    private readonly preferenceRepo: INotificationPreferenceRepository,
    // 可以注入其他服务
    // private readonly eventBus: IEventBus,
  ) {}

  /**
   * 创建并发送通知
   */
  public async createAndSendNotification(params: {
    identityId: string;
    title: string;
    content: string;
    type: NotificationType;
    category: NotificationCategory;
    importance?: ImportanceLevel;
    urgency?: UrgencyLevel;
    actions?: NotificationActionDTO[];
    metadata?: NotificationMetadataDTO;
    channels?: NotificationChannelType[]; // 指定发送渠道
  }): Promise<Notification> {
    logger.info('🔔 [领域服务] 开始创建通知', {
      identityId: params.identityId,
      title: params.title,
      type: params.type,
      category: params.category,
      channels: params.channels,
    });

    // 1. 检查用户偏好设置
    const preference = await this.preferenceRepo.findByIdentityId(params.identityId);

    if (preference) {
      logger.debug('📋 检查用户偏好设置', {
        identityId: params.identityId,
        hasPreference: true,
      });

      // 检查是否应该发送通知
      const shouldSend = preference.shouldSendNotification(
        params.category,
        NotificationChannelType.InApp, // 默认检查应用内通知
      );

      if (!shouldSend) {
        logger.warn('⛔ 用户偏好阻止发送通知', {
          identityId: params.identityId,
          category: params.category,
          type: params.type,
        });
        throw new Error('User preferences block this notification');
      }

      logger.debug('✅ 用户偏好允许发送通知');
    } else {
      logger.debug('📋 用户无偏好设置，使用默认设置');
    }

    // 2. 创建通知聚合根
    logger.debug('🏗️ 创建通知聚合根');
    const notification = Notification.create({
      identityId: params.identityId as IdentityId,
      title: params.title,
      content: params.content,
      type: params.type,
      category: params.category,
      importance: params.importance,
      actions: params.actions,
      metadata: params.metadata,
    });

    logger.info('✅ 通知聚合根已创建', {
      notificationId: String(notification.id),
      title: notification.title,
      type: notification.type,
      category: notification.category,
    });

    // 3. 添加渠道
    const channels = params.channels ?? [NotificationChannelType.InApp]; // 默认只发送应用内通知
    logger.debug('📡 添加通知渠道', { channels });
    
    for (const channelType of channels) {
      const channel = NotificationChannel.create({
        notificationId: notification.id,
        channelType,
        recipient: params.identityId,
      });
      notification.addChannel(channel);
      logger.debug(`  ➕ 已添加渠道: ${channelType}`);
    }

    // 4. 发送通知
    logger.debug('📤 标记通知为已发送');
    await notification.send();

    logger.info('✅ 通知已标记为已发送', {
      notificationId: String(notification.id),
      status: notification.status,
    });

    // 5. 持久化
    logger.debug('💾 持久化通知到数据库');
    await this.notificationRepo.save(notification);

    logger.info('✅✅✅ [领域服务] 通知创建完成', {
      notificationId: String(notification.id),
      identityId: String(notification.identityId),
      title: notification.title,
      type: notification.type,
      category: notification.category,
      status: notification.status,
      channelCount: channels.length,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    });

    // 6. 触发领域事件 - 用于 SSE 推送
    logger.info('📡 [领域服务] 发布 NotificationCreated 领域事件', {
      notificationId: String(notification.id),
      identityId: String(notification.identityId),
    });

    // 这里需要通过事件总线发布，让 SSE 管理器接收并推送
    // 我们在应用服务层处理这个逻辑

    return notification;
  }

  /**
   * 从模板创建通知
   */
  public async createNotificationFromTemplate(params: {
    identityId: string;
    templateId: string;
    variables: Record<string, unknown>;
    channels?: NotificationChannelType[];
  }): Promise<Notification> {
    // 1. 获取模板
    const template = await this.templateRepo.findById(params.templateId);
    if (!template) {
      throw new Error(`Template not found: ${params.templateId}`);
    }

    if (!template.isActive) {
      throw new Error(`Template is not active: ${params.templateId}`);
    }

    // 2. 验证变量
    const validation = template.validateVariables(params.variables);
    if (!validation.isValid) {
      throw new Error(`Missing template variables: ${validation.missingVariables.join(', ')}`);
    }

    // 3. 渲染模板
    const rendered = template.render(params.variables);

    // 4. 创建并发送通知
    return await this.createAndSendNotification({
      identityId: params.identityId,
      title: rendered.title,
      content: rendered.content,
      type: template.type,
      category: template.category,
      channels: params.channels,
    });
  }

  /**
   * 批量发送通知
   */
  public async sendBulkNotifications(
    notifications: Array<{
      identityId: string;
      title: string;
      content: string;
      type: NotificationType;
      category: NotificationCategory;
      importance?: ImportanceLevel;
      urgency?: UrgencyLevel;
    }>,
  ): Promise<Notification[]> {
    const created: Notification[] = [];

    for (const params of notifications) {
      try {
        const notification = await this.createAndSendNotification(params);
        created.push(notification);
      } catch (error) {
        // 记录错误但继续处理其他通知
        console.error(`Failed to send notification to ${params.identityId}:`, error);
      }
    }

    return created;
  }

  /**
   * 标记通知为已读
   */
  public async markAsRead(identityId: string, id: string): Promise<void> {
    const notification = await this.notificationRepo.findByIdForIdentity(identityId, id);
    if (!notification) {
      throw new Error(`Notification not found: ${id}`);
    }

    notification.markAsRead();
    await this.notificationRepo.save(notification);

    // 触发已读事件
    // await this.eventBus.publish({
    //   type: 'notification.read',
    //   aggregateId: id,
    //   timestamp: Date.now(),
    //   payload: { notificationId: id },
    // });
  }

  /**
   * 批量标记为已读
   */
  public async markManyAsRead(identityId: string, ids: string[]): Promise<void> {
    const notifications = (
      await Promise.all(ids.map((id) => this.notificationRepo.findByIdForIdentity(identityId, id)))
    ).filter((notification): notification is NonNullable<typeof notification> => notification !== null);

    for (const notification of notifications) {
      notification.markAsRead();
    }

    await this.notificationRepo.saveMany(notifications);
  }

  /**
   * 标记所有通知为已读
   */
  public async markAllAsRead(identityId: string): Promise<void> {
    const notifications = await this.notificationRepo.findUnread(identityId);

    for (const notification of notifications) {
      notification.markAsRead();
    }

    await this.notificationRepo.saveMany(notifications);
  }

  /**
   * 删除通知
   */
  public async deleteNotification(identityId: string, id: string, soft = true): Promise<void> {
    const notification = await this.notificationRepo.findByIdForIdentity(identityId, id);
    if (!notification) {
      throw new Error(`Notification not found: ${id}`);
    }

    if (soft) {
      notification.softDelete();
      await this.notificationRepo.save(notification);
    } else {
      await this.notificationRepo.delete(identityId, id);
    }
  }

  /**
   * 批量删除通知
   */
  public async deleteManyNotifications(
    identityId: string,
    ids: string[],
    soft = true,
  ): Promise<void> {
    const notifications = (
      await Promise.all(ids.map((id) => this.notificationRepo.findByIdForIdentity(identityId, id)))
    ).filter((notification): notification is NonNullable<typeof notification> => notification !== null);

    if (soft) {
      for (const notification of notifications) {
        notification.softDelete();
      }
      await this.notificationRepo.saveMany(notifications);
    } else {
      await this.notificationRepo.deleteMany(
        identityId,
        notifications.map((notification) => String(notification.id)),
      );
    }
  }

  /**
   * 获取通知详情
   */
  public async getNotification(
    identityId: string,
    id: string,
    options?: { includeChildren?: boolean },
  ): Promise<Notification | null> {
    return await this.notificationRepo.findByIdForIdentity(identityId, id, options);
  }

  /**
   * 获取用户的通知列表
   */
  public async getUserNotifications(
    identityId: string,
    options?: {
      includeRead?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<Notification[]> {
    return await this.notificationRepo.findByIdentityId(identityId, {
      includeRead: options?.includeRead ?? true,
      includeDeleted: false,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * 获取未读通知
   */
  public async getUnreadNotifications(
    identityId: string,
    options?: { limit?: number },
  ): Promise<Notification[]> {
    return await this.notificationRepo.findUnread(identityId, options);
  }

  /**
   * 获取未读通知数量
   */
  public async getUnreadCount(identityId: string): Promise<number> {
    return await this.notificationRepo.countUnread(identityId);
  }

  /**
   * 获取分类统计
   */
  public async getCategoryStats(
    identityId: string,
  ): Promise<Record<NotificationCategory, number>> {
    return await this.notificationRepo.countByCategory(identityId);
  }

  /**
   * 执行通知操作
   */
  public async executeNotificationAction(
    identityId: string,
    notificationId: string,
    actionId: string,
  ): Promise<void> {
    const notification = await this.notificationRepo.findByIdForIdentity(
      identityId,
      notificationId,
    );
    if (!notification) {
      throw new Error(`Notification not found: ${notificationId}`);
    }

    // 检查操作是否存在
    const actions = notification.actions;
    const action = actions?.find(a => a.id === actionId);
    if (!action) {
      throw new Error(`Action not found: ${actionId}`);
    }

    // 通知操作由应用服务层处理
    await this.notificationRepo.save(notification);

    // 触发操作执行事件
    // await this.eventBus.publish({
    //   type: 'notification.action.executed',
    //   aggregateId: notificationId,
    //   timestamp: Date.now(),
    //   payload: {
    //     notificationId,
    //     actionId,
    //   },
    // });
  }

  /**
   * 清理过期通知
   */
  public async cleanupExpiredNotifications(): Promise<number> {
    const now = Date.now();
    return await this.notificationRepo.cleanupExpired(now);
  }

  /**
   * 清理已删除通知（超过30天）
   */
  public async cleanupDeletedNotifications(daysAgo = 30): Promise<number> {
    const threshold = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
    return await this.notificationRepo.cleanupDeleted(threshold);
  }

  /**
   * 获取相关实体的通知
   */
  public async getNotificationsByRelatedEntity(
    identityId: string,
    relatedEntityType: string,
    relatedEntityId: string,
  ): Promise<Notification[]> {
    return await this.notificationRepo.findByRelatedEntity(
      identityId,
      relatedEntityType,
      relatedEntityId,
    );
  }
}
