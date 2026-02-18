/**
 * Adjust Reminder Frequency Service
 *
 * 调整提醒频率
 */

import type { IReminderTemplateRepository } from '@/domain-server/repositories/IReminderTemplateRepository';
import { eventBus } from '@dailyuse/utils';

/**
 * 调整结果
 */
export interface AdjustmentResult {
  templateId: string;
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
  templateId: string;
  newInterval: number;
  reason: string;
  identityId: string;
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
   */
  async execute(request: AdjustFrequencyRequest): Promise<AdjustmentResult> {
    const template = await this.templateRepository.findById(request.templateId);
    if (!template) {
      throw new Error(`Template ${request.templateId} not found`);
    }

    const originalInterval = template.recurrenceConfig?.interval || 0;

    if (template.recurrenceConfig) {
      template.recurrenceConfig.interval = request.newInterval;
    }

    await this.templateRepository.save(template);

    await eventBus.publish({
      eventType: 'reminder.frequency.adjusted',
      payload: {
        templateId: request.templateId,
        identityId: request.identityId,
        originalInterval,
        newInterval: request.newInterval,
        reason: request.reason,
        adjustedAt: Date.now(),
      },
    });

    return {
      templateId: request.templateId,
      success: true,
      originalInterval,
      adjustedInterval: request.newInterval,
      reason: request.reason,
      appliedAt: Date.now(),
    };
  }

  /**
   * 拒绝频率调整
   */
  async reject(templateId: string, identityId: string): Promise<void> {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    await eventBus.publish({
      eventType: 'reminder.frequency.adjustment.rejected',
      payload: {
        templateId,
        identityId,
        rejectedAt: Date.now(),
      },
    });
  }
}
