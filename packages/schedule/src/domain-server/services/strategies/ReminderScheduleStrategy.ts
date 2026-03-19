/**
 * Reminder 调度策略
 *
 * 职责：
 * - 将 Reminder 的触发器配置转换为调度配置
 * - 处理固定时间触发和间隔触发
 */

import { SourceModule, Timezone, TaskPriority } from '@dailyuse/contracts/schedule';
import type {
  FixedTimeTrigger,
  IntervalTrigger,
  ReminderTemplateServerDTO,
  TriggerConfigServerDTO,
} from '@dailyuse/contracts/reminder';
import { ReminderType, ReminderStatus, TriggerType } from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { ScheduleConfig } from '../../value-objects/ScheduleConfig';
import { TaskMetadata } from '../../value-objects/TaskMetadata';
import type {
  IScheduleStrategy,
  ScheduleStrategyInput,
  ScheduleStrategyOutput,
} from './IScheduleStrategy';

/**
 * Reminder 调度策略实现
 */
export class ReminderScheduleStrategy implements IScheduleStrategy {
  /**
   * 支持 REMINDER 源模块
   */
  supports(sourceModule: SourceModule): boolean {
    return sourceModule === SourceModule.Reminder;
  }

  /**
   * 判断 Reminder 是否需要创建调度任务
   * 条件：
   * 1. selfEnabled 为 true（自身启用）
   * 2. status 为 ACTIVE
   * 3. 有有效的 trigger 配置
   *
   * 注意：
   * - 固定时间提醒会创建每日固定时刻任务
   * - 间隔触发器会创建周期任务
   */
  shouldCreateSchedule(sourceEntity: ReminderTemplateServerDTO): boolean {
    // 必须启用且激活
    if (!sourceEntity.selfEnabled || sourceEntity.status !== ReminderStatus.Active) {
      return false;
    }

    // 必须有触发器配置
    if (!sourceEntity.trigger) {
      return false;
    }

    return true;
  }

  /**
   * 从 Reminder 创建调度配置
   */
  createSchedule(input: ScheduleStrategyInput): ScheduleStrategyOutput {
    const reminder = input.sourceEntity as ReminderTemplateServerDTO;

    if (!this.shouldCreateSchedule(reminder)) {
      throw new Error(`Reminder ${reminder.id} does not have valid configuration for scheduling`);
    }

    const { trigger, activeTime, type } = reminder;
    if (!trigger) {
      throw new Error(`Reminder ${reminder.id} missing trigger configuration`);
    }

    // 根据提醒类型和触发器生成 cron 表达式
    const cronExpression = this.generateCronExpression(trigger, type);

    // 创建调度配置
    // 重构后：startDate/endDate 移除，生效控制由 status 字段负责
    const scheduleConfig = ScheduleConfig.create({
      cronExpression,
      timezone: Timezone.Shanghai, // 默认时区，后续可以从用户设置获取
      startDate: activeTime.activatedAt ? new Date(activeTime.activatedAt).toISOString() : null, // 使用激活时间作为开始
      endDate: null, // 不再使用 endDate，生效控制由 status 负责
      maxExecutions: type === ReminderType.OneTime ? 1 : null, // 一次性提醒只执行一次
    });

    // 创建元数据
    const metadata = TaskMetadata.create({
      priority: this.calculatePriority(reminder),
      tags: this.generateTags(reminder),
      timeout: null, // 默认无超时限制
      payload: {
        reminderId: reminder.id,
        reminderTitle: reminder.name,
        reminderType: reminder.type,
        triggerType: trigger.type,
        importanceLevel: reminder.importanceLevel,
        notificationChannels: reminder.notificationConfig.channels,
      },
    });

    // 生成任务名称和描述
    const name = this.generateTaskName(reminder);
    const description = this.generateTaskDescription(reminder, trigger);

    return {
      name,
      description,
      scheduleConfig,
      metadata,
      enabled: true, // Reminder 调度默认启用
    };
  }

  /**
   * 生成 cron 表达式
   *
   * 策略：
   * - FIXED_TIME: 在每天固定时间触发
   * - INTERVAL: 每隔 N 分钟触发一次
   */
  private generateCronExpression(trigger: TriggerConfigServerDTO, type: ReminderType): string {
    if (trigger.type === TriggerType.FixedTime && trigger.fixedTime) {
      return this.generateFixedTimeCron(trigger.fixedTime, type);
    } else if (trigger.type === TriggerType.Interval && trigger.interval) {
      return this.generateIntervalCron(trigger.interval);
    }

    // 默认：每天早上 9:00
    return '0 0 9 * * *';
  }

  /**
   * 生成固定时间 cron
   */
  private generateFixedTimeCron(fixedTime: FixedTimeTrigger, type: ReminderType): string {
    // 解析时间字符串 "HH:mm"
    const [hourStr, minuteStr] = fixedTime.time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    // 一次性提醒：调度层按每天该时间检查，实际执行层根据业务状态控制是否只触发一次
    if (type === ReminderType.OneTime) {
      return `0 ${minute} ${hour} * * *`;
    }

    return `0 ${minute} ${hour} * * *`;
  }

  /**
   * 生成间隔触发 cron
   */
  private generateIntervalCron(interval: IntervalTrigger): string {
    const minutes = interval.minutes;

    if (minutes <= 0) {
      return '0 * * * * *';
    }

    if (minutes < 60) {
      if (60 % minutes === 0) {
        const triggers: number[] = [];
        for (let i = 0; i < 60; i += minutes) {
          triggers.push(i);
        }
        return `0 ${triggers.join(',')} * * * *`;
      }

      return `0 */${minutes} * * * *`;
    } else if (minutes === 60) {
      return `0 0 * * * *`;
    }

    if (minutes % 60 === 0) {
      const hours = minutes / 60;
      if (24 % hours === 0) {
        return `0 0 */${hours} * * *`;
      }

      return `0 0 * * * *`;
    }

    return `0 * * * * *`;
  }

  /**
   * 计算任务优先级
   * 基于 Reminder 的重要性级别
   */
  private calculatePriority(reminder: ReminderTemplateServerDTO): TaskPriority {
    const { importanceLevel } = reminder;

    // 根据重要性级别映射
    switch (importanceLevel) {
      case ImportanceLevel.Vital:
        return TaskPriority.Urgent;
      case ImportanceLevel.Important:
        return TaskPriority.High;
      case ImportanceLevel.Moderate:
        return TaskPriority.Normal;
      case ImportanceLevel.Minor:
      case ImportanceLevel.Trivial:
        return TaskPriority.Low;
      default:
        return TaskPriority.Normal;
    }
  }

  /**
   * 生成任务标签
   */
  private generateTags(reminder: ReminderTemplateServerDTO): string[] {
    const tags: string[] = [
      'reminder',
      `type:${reminder.type}`,
      `importance:${reminder.importanceLevel}`,
      `trigger:${reminder.trigger.type}`,
    ];

    // 添加通知渠道标签
    if (reminder.notificationConfig.channels) {
      tags.push(...reminder.notificationConfig.channels.map((channel) => `channel:${channel}`));
    }

    // 添加用户自定义标签
    if (reminder.tags && reminder.tags.length > 0) {
      tags.push(...reminder.tags.map((tag) => `user:${tag}`));
    }

    // 添加分组标签
    if (reminder.groupId) {
      tags.push(`group:${reminder.groupId}`);
    }

    return tags;
  }

  /**
   * 生成任务名称
   */
  private generateTaskName(reminder: ReminderTemplateServerDTO): string {
    return `Reminder: ${reminder.name}`;
  }

  /**
   * Generate task description
   * Display text moved to frontend i18n
   */
  private generateTaskDescription(
    reminder: ReminderTemplateServerDTO,
    trigger: TriggerConfigServerDTO,
  ): string {
    return '';
  }

  /**
   * Update schedule configuration (when Reminder configuration changes)
   */
  updateSchedule(
    existingSchedule: ScheduleStrategyOutput,
    input: ScheduleStrategyInput,
  ): ScheduleStrategyOutput {
    // 重新生成配置
    return this.createSchedule(input);
  }
}
