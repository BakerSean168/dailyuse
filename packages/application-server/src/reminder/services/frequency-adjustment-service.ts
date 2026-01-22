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

    // Store original interval for comparison
    const originalInterval = template.recurrenceConfig?.interval || 0;

    // Apply adjustment to template
    if (template.recurrenceConfig) {
      template.recurrenceConfig.interval = request.newInterval;
    }

    // Save updated template
    await this.templateRepository.save(template);

    // Publish frequency adjusted event
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

    // Publish rejection event
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

    // 检查是否有待确认的调整
    if (!template.frequencyAdjustment || template.frequencyAdjustment.userConfirmed) {
      throw new Error('No pending adjustment to accept');
    }

    // 应用调整
    const adjustment = template.frequencyAdjustment;
    await this.applyAdjustment(templateId, {
      originalInterval: adjustment.originalInterval,
      adjustedInterval: adjustment.adjustedInterval,
      reason: adjustment.adjustmentReason,
    });

    // 标记为已确认
    template.confirmFrequencyAdjustment();
    await this.reminderTemplateRepository.save(template);

    return {
      templateId,
      success: true,
      originalInterval: adjustment.originalInterval,
      adjustedInterval: adjustment.adjustedInterval,
      reason: adjustment.adjustmentReason,
      appliedAt: Date.now(),
    };
  }

  /**
   * 用户拒绝调整建议
   *
   * @param templateId - 提醒模板ID
   */
  async rejectAdjustment(templateId: string): Promise<void> {
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // 拒绝调整
    template.rejectFrequencyAdjustment('用户手动拒绝');
    await this.reminderTemplateRepository.save(template);
  }

  /**
   * 自动应用调整（不需要用户确认）
   *
   * @param templateId - 提醒模板ID
   * @param adjustment - 调整建议
   */
  async applyAutoAdjustment(
    templateId: string,
    adjustment: {
      originalInterval: number;
      adjustedInterval: number;
      reason: string;
    },
  ): Promise<AdjustmentResult> {
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // 创建频率调整记录
    const frequencyAdjustment = FrequencyAdjustment.create({
      originalInterval: adjustment.originalInterval,
      adjustedInterval: adjustment.adjustedInterval,
      adjustmentReason: adjustment.reason,
      isAutoAdjusted: true,
      userConfirmed: true, // 自动调整立即确认
    });

    template.applyFrequencyAdjustment(frequencyAdjustment.toServerDTO());

    // 应用到 trigger 配置
    await this.applyAdjustment(templateId, adjustment);

    await this.reminderTemplateRepository.save(template);

    return {
      templateId,
      success: true,
      originalInterval: adjustment.originalInterval,
      adjustedInterval: adjustment.adjustedInterval,
      reason: adjustment.reason,
      appliedAt: Date.now(),
    };
  }

  /**
   * 建议调整但等待用户确认（手动模式）
   *
   * @param templateId - 提醒模板ID
   */
  async suggestAdjustment(templateId: string): Promise<AdjustmentResult | null> {
    const suggestion = await this.analysisService.suggestFrequencyAdjustment(templateId);
    if (!suggestion) {
      return null;
    }

    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // 创建频率调整记录（等待确认）
    const frequencyAdjustment = FrequencyAdjustment.create({
      originalInterval: suggestion.originalInterval,
      adjustedInterval: suggestion.adjustedInterval,
      adjustmentReason: suggestion.reason,
      isAutoAdjusted: false,
      userConfirmed: false, // 等待用户确认
    });

    template.applyFrequencyAdjustment(frequencyAdjustment.toServerDTO());
    await this.reminderTemplateRepository.save(template);

    return {
      templateId,
      success: true,
      originalInterval: suggestion.originalInterval,
      adjustedInterval: suggestion.adjustedInterval,
      reason: suggestion.reason,
      appliedAt: Date.now(),
    };
  }

  /**
   * 批量处理自动调整
   *
   * @param accountUuid - 账户ID
   * @returns 调整结果列表
   */
  async batchAutoAdjust(accountUuid: string): Promise<AdjustmentResult[]> {
    const report = await this.analysisService.analyzeAllTemplates(accountUuid);
    const results: AdjustmentResult[] = [];

    // 处理低效提醒（自动降低频率）
    for (const lowEffective of report.lowEffective) {
      const template = await this.reminderTemplateRepository.findById(lowEffective.templateId);
      if (!template || !template.smartFrequencyEnabled) {
        continue;
      }

      // 检查是否已经有待确认的调整
      if (template.frequencyAdjustment && !template.frequencyAdjustment.userConfirmed) {
        continue;
      }

      try {
        const suggestion = await this.analysisService.suggestFrequencyAdjustment(
          lowEffective.templateId,
        );
        if (suggestion) {
          const result = await this.applyAutoAdjustment(lowEffective.templateId, suggestion);
          results.push(result);
        }
      } catch (error) {
        console.error(`Failed to adjust template ${lowEffective.templateId}:`, error);
      }
    }

    return results;
  }

  /**
   * 应用调整到 trigger 配置
   *
   * 注意：这里需要根据实际的 trigger 配置结构来实现
   * 目前暂时作为占位方法
   *
   * @private
   */
  private async applyAdjustment(
    templateId: string,
    adjustment: {
      originalInterval: number;
      adjustedInterval: number;
      reason: string;
    },
  ): Promise<void> {
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // TODO: 实际应用到 trigger 配置
    // 这里需要：
    // 1. 解析当前的 trigger 配置
    // 2. 根据 trigger 类型（interval/cron/specific）更新间隔
    // 3. 保存更新后的配置

    // 示例：如果是 interval trigger
    // const trigger = template.trigger;
    // if (trigger.type === 'interval') {
    //   trigger.interval = adjustment.adjustedInterval;
    //   template.updateTrigger(trigger);
    //   await this.reminderTemplateRepository.save(template);
    // }

    console.log(`[FrequencyAdjustmentService] Would adjust template ${templateId}:`, {
      from: adjustment.originalInterval,
      to: adjustment.adjustedInterval,
      reason: adjustment.reason,
    });
  }
}
