/**
 * Adjust Reminder Frequency Service
 *
 * 调整提醒频率
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IReminderTemplateRepository } from '@/domain-server/repositories/IReminderTemplateRepository';
import type { ReminderEventMap } from '@dailyuse/contracts/reminder';
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
export class AdjustReminderFrequencyUseCase {
  constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  /**
   * 接受并应用频率调整
   *
   * @param request - 调整请求
   * @returns 调整结果
   */
  async execute(request: AdjustFrequencyRequest): Promise<Result<AdjustmentResult>> {
    const template = await this.templateRepository.findById(request.templateId);
    if (!template) {
      return error('NOT_FOUND', `Template ${request.templateId} not found`);
    }

    const trigger = {
      type: template.trigger.type,
      fixedTime: template.trigger.fixedTime,
      interval: template.trigger.interval,
    };
    if (trigger.type !== 'Interval' || !trigger.interval) {
      return error('BAD_REQUEST', `Template ${request.templateId} does not use interval trigger`);
    }

    const originalInterval = trigger.interval.minutes;

    template.update({
      trigger: {
        ...trigger,
        interval: {
          ...trigger.interval,
          minutes: request.newInterval,
        },
      },
    });

    await this.templateRepository.save(template);

    // Publish event
    const adjustedEvent: ReminderEventMap['reminder:frequency:adjusted'] = {
      templateId: request.templateId as ReminderEventMap['reminder:frequency:adjusted']['templateId'],
      originalInterval,
      adjustedInterval: request.newInterval,
      reason: request.reason,
      identityId: request.identityId as ReminderEventMap['reminder:frequency:adjusted']['identityId'],
      adjustedAt: Date.now(),
    };
    eventBus.send('reminder:frequency:adjusted', adjustedEvent);

    return ok({
      templateId: request.templateId,
      success: true,
      originalInterval,
      adjustedInterval: request.newInterval,
      reason: request.reason,
      appliedAt: Date.now(),
    });
  }

  /**
   * 拒绝频率调整
   *
   * @param templateId - 模板UUID
   * @param identityId - 账户 ID
   */
  async reject(templateId: string, identityId: string): Promise<Result<void>> {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      return error('NOT_FOUND', `Template ${templateId} not found`);
    }

    const rejectedEvent: ReminderEventMap['reminder:frequency:adjustment-rejected'] = {
      templateId: templateId as ReminderEventMap['reminder:frequency:adjustment-rejected']['templateId'],
      identityId:
        identityId as ReminderEventMap['reminder:frequency:adjustment-rejected']['identityId'],
      rejectedAt: Date.now(),
    };
    eventBus.send('reminder:frequency:adjustment-rejected', rejectedEvent);

    return ok(undefined);
  }
}
