/**
 * ScheduleTaskTriggeredHandler - Schedule 任务触发事件处理器
 * 
 * @responsibility
 * - 监听 schedule.task.triggered 事件
 * - 创建对应的 Notification 记录
 * 
 * @architecture
 * - 应用服务层（Application Service）
 * - 事件驱动架构（Event-Driven）
 * - 跨模块通信（Schedule → Notification）
 */

import { createLogger, eventBus } from '@dailyuse/utils';
import type { NotificationServerDTO, NotificationPreferenceServerDTO, CreateNotificationRequest } from '@dailyuse/contracts/notification';
import { NotificationChannelType, NotificationType, NotificationCategory, RelatedEntityType } from '@dailyuse/contracts/notification';
import { ScheduleTaskEventTypes } from '@dailyuse/contracts/schedule';
import { NotificationApplicationService } from '../services/NotificationApplicationService';

const logger = createLogger('ScheduleTaskTriggeredHandler');

/**
 * 注册 Schedule 事件监听器
 */
export function registerScheduleEventListeners(): void {
  // 监听 schedule.task.triggered 事件
  eventBus.subscribe(ScheduleTaskEventTypes.TRIGGERED, async (event: any) => {
    try {
      logger.info(`📩 接收到 ${ScheduleTaskEventTypes.TRIGGERED} 事件`, {
        taskUuid: event.payload?.taskUuid,
        taskName: event.payload?.taskName,
        sourceModule: event.payload?.sourceModule,
        accountUuid: event.accountUuid,
        metadataType: typeof event.payload?.metadata,
        metadataKeys: event.payload?.metadata ? Object.keys(event.payload.metadata) : [],
      });

      // 验证必需字段
      if (!event.accountUuid) {
        logger.error('❌ 事件缺少 accountUuid', { event });
        return;
      }

      if (!event.payload?.taskUuid) {
        logger.error('❌ 事件缺少 taskUuid', { event });
        return;
      }

      // 获取 metadata（应该是完整的 DTO 对象）
      const metadata = event.payload?.metadata;
      
      logger.debug('📦 Metadata 内容', {
        metadata,
        hasPayload: !!metadata?.payload,
        hasTags: !!metadata?.tags,
        priority: metadata?.priority,
        timeout: metadata?.timeout,
      });

      // 创建通知
      const notificationService = await NotificationApplicationService.getInstance();
      
      // 从 metadata.payload 中获取通知配置
      const payloadData = metadata?.payload || {};
      const title = payloadData.reminderTitle || event.payload?.taskName || '定时任务提醒';
      const content = payloadData.message || `任务"${event.payload?.taskName}"已触发`;
      
      // 解析通知渠道
      let channels: NotificationChannelType[] = [
        NotificationChannelType.IN_APP,
      ];
      if (payloadData.notificationChannels && Array.isArray(payloadData.notificationChannels)) {
        channels = payloadData.notificationChannels
          .map((ch: string) => {
            // 转换为正确的枚举值
            const channelUpper = ch.toUpperCase();
            return NotificationChannelType[
              channelUpper as keyof typeof NotificationChannelType
            ];
          })
          .filter(Boolean); // 过滤掉无效值
      }

      logger.info('📝 准备创建通知', {
        title,
        content,
        channels,
        relatedEntityType: event.payload?.sourceModule,
        relatedEntityUuid: event.payload?.sourceEntityId,
      });

      const notification = await notificationService.createNotification({
        accountUuid: event.accountUuid,
        title,
        content,
        type: NotificationType.REMINDER,
        category: NotificationCategory.TASK,
        relatedEntityType: event.payload?.sourceModule?.toUpperCase() as RelatedEntityType,
        relatedEntityUuid: event.payload?.sourceEntityId,
        channels,
      });

      logger.info('✅ 成功创建通知', {
        notificationUuid: notification.uuid,
        taskUuid: event.payload?.taskUuid,
        title,
        channels,
        relatedEntityType: notification.relatedEntityType,
        relatedEntityUuid: notification.relatedEntityUuid,
      });
    } catch (error) {
      logger.error(`❌ 处理 ${ScheduleTaskEventTypes.TRIGGERED} 事件失败`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        event: {
          accountUuid: event.accountUuid,
          taskUuid: event.payload?.taskUuid,
          taskName: event.payload?.taskName,
        },
      });
    }
  });

  logger.info('✅ Schedule 事件监听器注册完成');
}


