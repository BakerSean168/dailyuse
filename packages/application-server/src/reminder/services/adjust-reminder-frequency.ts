/**
 * Adjust Reminder Frequency Service
 *
 * 调整提醒频率
 */

import type { IReminderTemplateRepository } from '@dailyuse/domain-server/reminder';
import { eventBus } from '@dailyuse/utils';

/**
 * 调整结果
 */
export interface AdjustmentResult {
  templateUuid: string;
  success: boolean;
  originalInterval: number;
  adjustedInterval: number;
  reason: string;
  appliedAt: number;
}

/**
 * 频率调整请求
 */
export interface AdjustFrequencyRequest {
  templateUuid: string;
  newInterval: number;
  reason: string;
  accountUuid: string;
}

/**
 * Adjust Reminder Frequency Service
 *
 * 职责：
 * - 应用频率调整建议
 * - 处理用户确认/拒绝调整
 * - 自动应用调整（当用户启用自动模式时）
 */
export class AdjustReminderFrequency {
  constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  /**
   * 接受并应用频率调整
   *
   * @param request - 调整请求
   * @returns 调整结果
   */
  async execute(request: AdjustFrequencyRequest): Promise<AdjustmentResult> {
    const template = await this.templateRepository.findById(request.templateUuid);
    if (!template) {
      throw new Error(`Template ${request.templateUuid} not found`);
    }

    // Get current recurrence details for comparison
    const originalInterval = template.recurrence?.daily?.interval || 0;

    // Apply adjustment using domain update method
    if (template.recurrence?.daily) {
      template.update({
        recurrence: template.recurrence.with({
          daily: {
            ...template.recurrence.daily,
            interval: request.newInterval,
          },
        }),
      });
    }

    await this.templateRepository.save(template);

    // Publish event
    await eventBus.publish({
      eventType: 'reminder.frequency.adjusted',
      payload: {
        templateUuid: request.templateUuid,
        originalInterval,
        adjustedInterval: request.newInterval,
        reason: request.reason,
        accountUuid: request.accountUuid,
        adjustedAt: Date.now(),
      },
      timestamp: Date.now(),
    });

    return {
      templateUuid: request.templateUuid,
      success: true,
      originalInterval,
      adjustedInterval: request.newInterval,
      reason: request.reason,
      appliedAt: Date.now(),
    };
  }

  /**
   * 拒绝频率调整
   *
   * @param templateUuid - 模板UUID
   * @param accountUuid - 账户UUID
   */
  async reject(templateUuid: string, accountUuid: string): Promise<void> {
    const template = await this.templateRepository.findById(templateUuid);
    if (!template) {
      throw new Error(`Template ${templateUuid} not found`);
    }

    await eventBus.publish({
      eventType: 'reminder.frequency.adjustment.rejected',
      payload: {
        templateUuid,
        accountUuid,
        rejectedAt: Date.now(),
      },
      timestamp: Date.now(),
    });
  }
}
