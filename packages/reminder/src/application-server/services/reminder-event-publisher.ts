/**
 * Reminder Event Publisher Service
 *
 * 提醒事件发布器 - 应用层事件发布的中央协调器
 */

import type { Goal } from '@dailyuse/goal/domain-server';
import type { ReminderTemplate } from '../../domain-server/aggregates/reminder-template';
import { createLogger, eventBus } from '@dailyuse/utils';

const logger = createLogger('ReminderEventPublisher');

/**
 * Reminder Event Publisher
 *
 * 职责：
 * - 从领域聚合根中收集未发布的事件
 * - 协调跨服务的事件发布
 * - 提供统一的事件发布接口
 * - 处理事件发布的失败和重试
 *
 * 使用场景：
 * - CreateReminderTemplate, UpdateReminderTemplate, DeleteReminderTemplate 会调用本服务来发布事件
 * - 确保事件的一致性和可追溯性
 */
export class ReminderEventPublisher {
  /**
   * 发布提醒模板的领域事件
   *
   * @param template - 提醒模板聚合根
   */
  async publishReminderTemplateEvents(template: ReminderTemplate): Promise<void> {
    try {
      const events = template.getDomainEvents?.();
      if (!events || events.length === 0) {
        return;
      }

      logger.info('Publishing reminder template events', {
        templateId: template.id,
        eventCount: events.length,
      });

      for (const event of events) {
        const payload = event.payload as Record<string, unknown>;
        const enrichedEvent = {
          ...event,
          payload: {
            ...payload,
            reminderData: template.toServerDTO?.(),
          },
        };

        try {
          await eventBus.publish(enrichedEvent);
          logger.debug('Event published', {
            eventType: event.eventType,
            templateId: template.id,
          });
        } catch (error) {
          logger.error('Failed to publish event', {
            eventType: event.eventType,
            templateId: template.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      }

      // 清除已发布的事件
      template.clearDomainEvents?.();
    } catch (error) {
      logger.error('Failed to publish reminder template events', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId: template.id,
      });
      throw error;
    }
  }

  /**
   * 发布提醒删除事件
   *
   * @param templateId - 提醒模板UUID
   * @param identityId - 账户 ID
   */
  async publishReminderDeletedEvent(
    templateId: string,
    identityId: string,
  ): Promise<void> {
    try {
      logger.info('Publishing reminder deleted event', {
        templateId,
        identityId,
      });

      await eventBus.publish({
        eventType: 'reminder.template.deleted',
        payload: {
          reminderId: templateId,
          identityId,
          deletedAt: Date.now(),
        },
        timestamp: Date.now(),
      });

      logger.debug('Reminder deleted event published', { templateId });
    } catch (error) {
      logger.error('Failed to publish reminder deleted event', {
        templateId,
        identityId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * 发布响应记录事件
   *
   * @param responseId - 响应记录UUID
   * @param templateId - 提醒模板UUID
   * @param action - 响应行为
   * @param responseTime - 响应时间（秒）
   * @param identityId - 账户 ID
   */
  async publishResponseRecordedEvent(
    responseId: string,
    templateId: string,
    action: string,
    responseTime: number | null,
    identityId: string,
  ): Promise<void> {
    try {
      logger.info('Publishing response recorded event', {
        responseId,
        templateId,
        action,
        identityId,
      });

      await eventBus.publish({
        eventType: 'reminder.response.recorded',
        payload: {
          responseId,
          templateId,
          action,
          responseTime,
          identityId,
          recordedAt: Date.now(),
        },
        timestamp: Date.now(),
      });

      logger.debug('Response recorded event published', { responseId });
    } catch (error) {
      logger.error('Failed to publish response recorded event', {
        responseId,
        templateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * 发布频率调整事件
   *
   * @param templateId - 提醒模板UUID
   * @param adjustment - 调整信息
   * @param identityId - 账户 ID
   */
  async publishFrequencyAdjustedEvent(
    templateId: string,
    adjustment: {
      originalInterval: number;
      adjustedInterval: number;
      reason: string;
    },
    identityId: string,
  ): Promise<void> {
    try {
      logger.info('Publishing frequency adjusted event', {
        templateId,
        identityId,
      });

      await eventBus.publish({
        eventType: 'reminder.frequency.adjusted',
        payload: {
          templateId,
          originalInterval: adjustment.originalInterval,
          adjustedInterval: adjustment.adjustedInterval,
          reason: adjustment.reason,
          identityId,
          adjustedAt: Date.now(),
        },
        timestamp: Date.now(),
      });

      logger.debug('Frequency adjusted event published', { templateId });
    } catch (error) {
      logger.error('Failed to publish frequency adjusted event', {
        templateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
