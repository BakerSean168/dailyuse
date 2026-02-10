/**
 * Task 调度策略
 * 
 * 职责：
 * - 将 Task 的重复配置（RecurrenceRule + ReminderConfig）转换为调度配置
 * - 处理每日、每周、每月重复
 * - 支持提醒时间偏移
 */

import { SourceModule, Timezone, TaskPriority } from '@dailyuse/contracts/schedule';
import type { RecurrenceRuleDTO, ReminderTimeUnit, TaskReminderConfigDTO, TaskTemplateServerDTO, TaskTimeConfigDTO } from '@dailyuse/contracts/task';
import { DayOfWeek, RecurrenceFrequency } from '@dailyuse/contracts/task';
import { ScheduleConfig } from '../../value-objects/ScheduleConfig';
import { TaskMetadata } from '../../value-objects/TaskMetadata';
import type {
  IScheduleStrategy,
  ScheduleStrategyInput,
  ScheduleStrategyOutput,
} from './IScheduleStrategy';

/**
 * Task 调度策略实现
 */
export class TaskScheduleStrategy implements IScheduleStrategy {
  /**
   * 支持 TASK 源模块
   */
  supports(sourceModule: SourceModule): boolean {
    return sourceModule === SourceModule.Task;
  }

  /**
   * 判断 Task 是否需要创建调度任务
   * 条件：
   * 1. 是 RECURRING 类型（循环任务）
   * 2. 有 recurrenceRule
   * 3. 有 reminderConfig 且已启用
   */
  shouldCreateSchedule(sourceEntity: TaskTemplateServerDTO): boolean {
    // 必须有重复规则（循环任务）
    if (!sourceEntity.recurrenceRule) {
      return false;
    }

    // 必须有提醒配置且已启用
    if (!sourceEntity.reminderConfig || !sourceEntity.reminderConfig.enabled) {
      return false;
    }

    // 必须有至少一个提醒触发器
    return sourceEntity.reminderConfig.triggers.length > 0;
  }

  /**
   * 从 Task 创建调度配置
   */
  createSchedule(input: ScheduleStrategyInput): ScheduleStrategyOutput {
    const task = input.sourceEntity as TaskTemplateServerDTO;

    if (!this.shouldCreateSchedule(task)) {
      throw new Error(
        `Task ${task.id} does not have valid configuration for scheduling`,
      );
    }

    const { recurrenceRule, reminderConfig, timeConfig } = task;
    if (!recurrenceRule || !reminderConfig) {
      throw new Error(`Task ${task.id} missing recurrenceRule or reminderConfig`);
    }

    // 根据重复规则生成 cron 表达式
    const cronExpression = this.generateCronExpression(recurrenceRule, reminderConfig, timeConfig);

    // 创建调度配置
    const startTimestamp = timeConfig?.startDate ?? Date.now();
    const scheduleConfig = ScheduleConfig.fromDTO({
      cronExpression,
      timezone: Timezone.Shanghai, // 默认时区，后续可以从用户设置获取
      startDate: new Date(startTimestamp).toISOString(),
      endDate: recurrenceRule.endDate ? new Date(recurrenceRule.endDate).toISOString() : null, // 结束日期从重复规则获取，不再从 timeConfig 获取
      maxExecutions: recurrenceRule.occurrences ?? null,
    });

    // 创建元数据
    const metadata = TaskMetadata.create({
      priority: this.calculatePriority(task),
      tags: this.generateTags(task),
      timeout: null,
      payload: {
        taskId: task.id,
        taskTitle: task.name,
        recurrenceFrequency: recurrenceRule.frequency,
        reminderTriggers: reminderConfig.triggers,
        importance: task.importance,
      },
    });

    // 生成任务名称和描述
    const name = this.generateTaskName(task);
    const description = this.generateTaskDescription(task, recurrenceRule);

    return {
      name,
      description,
      scheduleConfig,
      metadata,
      enabled: true, // Task 提醒默认启用
    };
  }

  /**
   * 生成 cron 表达式
   * 
   * 策略：
   * - DAILY: 每天在指定时间触发
   * - WEEKLY: 每周指定的几天触发
   * - MONTHLY: 每月指定日期触发（简化版：每月1号）
   * - YEARLY: 每年指定日期触发（简化版：每年1月1号）
   * 
   * 提醒时间：
   * - 如果有 RELATIVE 类型触发器，根据相对时间计算
   * - 如果有 ABSOLUTE 类型触发器，使用绝对时间
   * - 默认：任务开始时间或 9:00
   */
  private generateCronExpression(
    recurrenceRule: RecurrenceRuleDTO,
    reminderConfig: TaskReminderConfigDTO,
    timeConfig?: TaskTimeConfigDTO | null,
  ): string {
    // 确定提醒时间（小时和分钟）
    const { hour, minute } = this.calculateReminderTime(reminderConfig, timeConfig);

    // 根据重复频率生成 cron
    switch (recurrenceRule.frequency) {
      case RecurrenceFrequency.Daily:
        // 每 N 天，在指定时间
        if (recurrenceRule.interval === 1) {
          return `0 ${minute} ${hour} * * *`; // 每天
        } else {
          // 简化：每天检查，由执行器判断是否应该触发
          return `0 ${minute} ${hour} * * *`;
        }

      case RecurrenceFrequency.Weekly:
        // 每周指定的几天
        const daysOfWeek = this.convertDaysOfWeekToCron(recurrenceRule.daysOfWeek);
        if (recurrenceRule.interval === 1) {
          return `0 ${minute} ${hour} * * ${daysOfWeek}`;
        } else {
          // 简化：每周指定天检查，由执行器判断周间隔
          return `0 ${minute} ${hour} * * ${daysOfWeek}`;
        }

      case RecurrenceFrequency.Monthly:
        // 每月 1 号（简化版）
        return `0 ${minute} ${hour} 1 * *`;

      case RecurrenceFrequency.Yearly:
        // 每年 1 月 1 号（简化版）
        return `0 ${minute} ${hour} 1 1 *`;

      default:
        // 默认每天
        return `0 ${minute} ${hour} * * *`;
    }
  }

  /**
   * 计算提醒时间
   */
  private calculateReminderTime(
    reminderConfig: TaskReminderConfigDTO,
    timeConfig?: TaskTimeConfigDTO | null,
  ): { hour: number; minute: number } {
    // 查找第一个触发器
    const firstTrigger = reminderConfig.triggers[0];

    if (firstTrigger.type === 'Absolute' && firstTrigger.absoluteTime) {
      // 使用绝对时间
      const date = new Date(firstTrigger.absoluteTime);
      return {
        hour: date.getHours(),
        minute: date.getMinutes(),
      };
    } else if (firstTrigger.type === 'Relative') {
      // 相对时间：使用任务的时间配置
      if (timeConfig?.timePoint) {
        const date = new Date(timeConfig.timePoint);
        let hour = date.getHours();
        let minute = date.getMinutes();

        // 应用相对偏移
        if (firstTrigger.relativeValue && firstTrigger.relativeUnit) {
          const offsetMinutes = this.convertToMinutes(
            firstTrigger.relativeValue,
            firstTrigger.relativeUnit,
          );
          const totalMinutes = hour * 60 + minute - offsetMinutes;
          hour = Math.floor(totalMinutes / 60) % 24;
          minute = totalMinutes % 60;
        }

        return { hour: Math.max(0, hour), minute: Math.max(0, minute) };
      } else if (timeConfig?.timeRange) {
        // 使用时间段的开始时间
        const date = new Date(timeConfig.timeRange.start);
        return {
          hour: date.getHours(),
          minute: date.getMinutes(),
        };
      }
    }

    // 默认：早上 9:00
    return { hour: 9, minute: 0 };
  }

  /**
   * 转换时间单位到分钟
   */
  private convertToMinutes(value: number, unit: ReminderTimeUnit): number {
    switch (unit) {
      case 'Minutes':
        return value;
      case 'Hours':
        return value * 60;
      case 'Days':
        return value * 24 * 60;
      default:
        return 0;
    }
  }

  /**
   * 转换星期几到 cron 格式
   * DayOfWeek: 0=周日, 1=周一, ..., 6=周六
   * Cron: 0=周日, 1=周一, ..., 6=周六（相同）
   */
  private convertDaysOfWeekToCron(daysOfWeek: DayOfWeek[]): string {
    if (daysOfWeek.length === 0) {
      return '*'; // 每天
    }

    // 直接使用枚举值
    return daysOfWeek.join(',');
  }

  /**
   * 计算任务优先级
   * 基于 Task 的重要性（importance）
   * Note: urgency已在Story 1.1中移除，现在只使用importance
   */
  private calculatePriority(task: TaskTemplateServerDTO): TaskPriority {
    const { importance } = task;

    // Vital = Urgent
    if (importance === 'Vital') {
      return TaskPriority.Urgent;
    }

    // Important = High
    if (importance === 'Important') {
      return TaskPriority.High;
    }

    // Moderate = Normal
    if (importance === 'Moderate') {
      return TaskPriority.Normal;
    }

    // Minor/Trivial = Low
    return TaskPriority.Low;
  }

  /**
   * 生成任务标签
   */
  private generateTags(task: TaskTemplateServerDTO): string[] {
    const tags: string[] = [
      'task-reminder',
      `importance:${task.importance}`,
      `frequency:${task.recurrenceRule?.frequency}`,
    ];

    // 添加用户自定义标签
    if (task.tags && task.tags.length > 0) {
      tags.push(...task.tags.map((tag) => `user:${tag}`));
    }

    // 添加文件夹标签
    if (task.folderId) {
      tags.push(`folder:${task.folderId}`);
    }

    return tags;
  }

  /**
   * 生成任务名称
   */
  private generateTaskName(task: TaskTemplateServerDTO): string {
    return `Task Reminder: ${task.name}`;
  }

  /**
   * 生成任务描述
   */
  private generateTaskDescription(
    task: TaskTemplateServerDTO,
    recurrenceRule: RecurrenceRuleDTO,
  ): string {
    const frequencyText = this.getFrequencyText(recurrenceRule);
    const reminderCount = task.reminderConfig?.triggers.length ?? 0;

    return `循环任务提醒\n重复规则: ${frequencyText}\n提醒触发器: ${reminderCount} 个`;
  }

  /**
   * 获取频率文本
   */
  private getFrequencyText(recurrenceRule: RecurrenceRuleDTO): string {
    const interval = recurrenceRule.interval;
    const frequency = recurrenceRule.frequency;

    if (interval === 1) {
      return frequency;
    } else {
      // Display text moved to frontend i18n
      return `${interval} days`;
    }
  }

  /**
   * Update schedule configuration (when Task configuration changes)
   */
  updateSchedule(
    existingSchedule: ScheduleStrategyOutput,
    input: ScheduleStrategyInput,
  ): ScheduleStrategyOutput {
    // 重新生成配置
    return this.createSchedule(input);
  }
}
