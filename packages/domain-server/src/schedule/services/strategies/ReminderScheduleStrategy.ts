/**
 * Reminder 调度策略
 * 
 * 职责：
 * - 将 Reminder 的触发器配置（TriggerConfig）和重复配置（RecurrenceConfig）转换为调度配置
 * - 处理固定时间触发和间隔触发
 * - 支持每日、每周、自定义日期重复
 */

import { SourceModule, Timezone, TaskPriority } from '@dailyuse/contracts/schedule';
import type { FixedTimeTrigger, IntervalTrigger, RecurrenceConfigServerDTO, ReminderTemplateServerDTO, TriggerConfigServerDTO } from '@dailyuse/contracts/reminder';
import { ReminderType, ReminderStatus, TriggerType, RecurrenceType, WeekDay } from '@dailyuse/contracts/reminder';
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
   * - RECURRING 类型即使没有 recurrence 配置，也会创建（使用默认配置）
   * - INTERVAL 触发器会创建周期任务
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

    // ✅ RECURRING 或 ONE_TIME 且有 trigger 即可创建调度任务
    // （RECURRING 没有 recurrence 时会使用默认的每日配置）
    return true;
  }

  /**
   * 从 Reminder 创建调度配置
   */
  createSchedule(input: ScheduleStrategyInput): ScheduleStrategyOutput {
    const reminder = input.sourceEntity as ReminderTemplateServerDTO;

    if (!this.shouldCreateSchedule(reminder)) {
      throw new Error(
        `Reminder ${reminder.id} does not have valid configuration for scheduling`,
      );
    }

    const { trigger, recurrence, activeTime, type } = reminder;
    if (!trigger) {
      throw new Error(`Reminder ${reminder.id} missing trigger configuration`);
    }

    // 根据提醒类型和触发器生成 cron 表达式
    const cronExpression = this.generateCronExpression(trigger, recurrence, type);

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
        reminderUuid: reminder.id,
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
   * - FIXED_TIME: 固定时间触发
   *   - ONE_TIME: 在指定日期时间执行一次
   *   - RECURRING: 根据重复规则在固定时间触发
   * - INTERVAL: 间隔触发
   *   - 每隔 N 分钟触发一次
   */
  private generateCronExpression(
    trigger: TriggerConfigServerDTO,
    recurrence: RecurrenceConfigServerDTO | null | undefined,
    type: ReminderType,
  ): string {
    if (trigger.type === TriggerType.FixedTime && trigger.fixedTime) {
      return this.generateFixedTimeCron(trigger.fixedTime, recurrence, type);
    } else if (trigger.type === TriggerType.Interval && trigger.interval) {
      return this.generateIntervalCron(trigger.interval);
    }

    // 默认：每天早上 9:00
    return '0 0 9 * * *';
  }

  /**
   * 生成固定时间 cron
   */
  private generateFixedTimeCron(
    fixedTime: FixedTimeTrigger,
    recurrence: RecurrenceConfigServerDTO | null | undefined,
    type: ReminderType,
  ): string {
    // 解析时间字符串 "HH:mm"
    const [hourStr, minuteStr] = fixedTime.time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    // 一次性提醒：暂时简化为每天该时间（实际执行时会检查日期）
    if (type === ReminderType.OneTime) {
      return `0 ${minute} ${hour} * * *`;
    }

    // 循环提醒：根据重复规则
    // ✅ 当 recurrence 为 null/undefined 时，默认每日触发
    if (!recurrence) {
      // 默认：每天该时间触发
      return `0 ${minute} ${hour} * * *`;
    }

    switch (recurrence.type) {
      case RecurrenceType.Daily:
        // 每 N 天
        if (recurrence.daily?.interval === 1) {
          return `0 ${minute} ${hour} * * *`; // 每天
        } else {
          // 简化：每天检查，由执行器判断间隔
          return `0 ${minute} ${hour} * * *`;
        }

      case RecurrenceType.Weekly:
        // 每周指定的几天
        if (recurrence.weekly) {
          const daysOfWeek = this.convertWeekDaysToCron(recurrence.weekly.weekDays);
          return `0 ${minute} ${hour} * * ${daysOfWeek}`;
        }
        return `0 ${minute} ${hour} * * *`;

      case RecurrenceType.CustomDays:
        // 自定义日期：简化为每天检查，由执行器判断是否是指定日期
        return `0 ${minute} ${hour} * * *`;

      default:
        return `0 ${minute} ${hour} * * *`;
    }
  }

  /**
   * 生成间隔触发 cron
   */
  private generateIntervalCron(interval: IntervalTrigger): string {
    const minutes = interval.minutes;

    // 简化：每小时的固定分钟数触发
    // 例如：每30分钟 → 0,30 * * * *
    if (minutes < 60) {
      if (60 % minutes === 0) {
        // 可以整除的情况
        const triggers: number[] = [];
        for (let i = 0; i < 60; i += minutes) {
          triggers.push(i);
        }
        return `0 ${triggers.join(',')} * * * *`;
      } else {
        // 不能整除，简化为每分钟检查（由执行器判断间隔）
        return `0 0/${minutes} * * * *`;
      }
    } else if (minutes === 60) {
      // 每小时
      return `0 0 * * * *`;
    } else {
      // 超过1小时，简化为每小时检查
      return `0 0 * * * *`;
    }
  }

  /**
   * 转换星期几到 cron 格式
   * WeekDay: MONDAY, TUESDAY, ..., SUNDAY
   * Cron: 1=周一, 2=周二, ..., 0=周日
   */
  private convertWeekDaysToCron(weekDays: WeekDay[]): string {
    if (weekDays.length === 0) {
      return '*'; // 每天
    }

    const cronDays = weekDays.map((day) => {
      const map: Record<WeekDay, number> = {
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
        Sunday: 0,
      };
      return map[day];
    });

    return cronDays.sort((a, b) => a - b).join(',');
  }

  /**
   * 计算任务优先级
   * 基于 Reminder 的重要性级别
   */
  private calculatePriority(
    reminder: ReminderTemplateServerDTO,
  ): TaskPriority {
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
      tags.push(
        ...reminder.notificationConfig.channels.map((channel) => `channel:${channel}`),
      );
    }

    // 添加用户自定义标签
    if (reminder.tags && reminder.tags.length > 0) {
      tags.push(...reminder.tags.map((tag) => `user:${tag}`));
    }

    // 添加分组标签
    if (reminder.groupUuid) {
      tags.push(`group:${reminder.groupUuid}`);
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
