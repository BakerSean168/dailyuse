/**
 * Goal 调度策略
 * 
 * 职责：
 * - 将 Goal 的 ReminderTrigger 转换为调度配置
 * - 处理时间进度百分比触发器
 * - 处理剩余天数触发器
 */

import { SourceModule, Timezone, TaskPriority } from '@dailyuse/contracts/schedule';
import type { GoalServerDTO, ReminderTrigger } from '@dailyuse/contracts/goal';
import { ScheduleConfig } from '../../value-objects/ScheduleConfig';
import { TaskMetadata } from '../../value-objects/TaskMetadata';
import type {
  IScheduleStrategy,
  ScheduleStrategyInput,
  ScheduleStrategyOutput,
} from './IScheduleStrategy';

/**
 * Goal 调度策略实现
 */
export class GoalScheduleStrategy implements IScheduleStrategy {
  /**
   * 支持 GOAL 源模块
   */
  supports(sourceModule: SourceModule): boolean {
    return sourceModule === SourceModule.GOAL;
  }

  /**
   * 判断 Goal 是否需要创建调度任务
   * 条件：有 reminderConfig 且已启用，且有活跃的触发器
   */
  shouldCreateSchedule(sourceEntity: GoalServerDTO): boolean {
    if (!sourceEntity.reminderConfig) {
      return false;
    }

    const { enabled, triggers } = sourceEntity.reminderConfig;

    // 必须启用且有至少一个启用的触发器
    return enabled && triggers.some((t) => t.enabled);
  }

  /**
   * 从 Goal 创建调度配置
   */
  createSchedule(input: ScheduleStrategyInput): ScheduleStrategyOutput {
    const goal = input.sourceEntity as GoalServerDTO;

    if (!this.shouldCreateSchedule(goal)) {
      throw new Error(
        `Goal ${goal.uuid} does not have valid reminder configuration for scheduling`,
      );
    }

    const { reminderConfig } = goal;
    if (!reminderConfig) {
      throw new Error(`Goal ${goal.uuid} missing reminderConfig`);
    }

    // 获取所有启用的触发器
    const activeTriggers = reminderConfig.triggers.filter((t) => t.enabled);

  // 根据目标类型生成 cron 表达式
  const cronExpression = this.generateCronExpression(goal);

    // 创建调度配置
    const scheduleConfig = new ScheduleConfig({
      cronExpression,
      timezone: Timezone.SHANGHAI, // 默认时区，后续可以从用户设置获取
      startDate: goal.startDate ?? Date.now(),
      endDate: goal.targetDate ?? null,
      maxExecutions: null, // Goal 的提醒通常没有最大执行次数限制
    });

    // 创建元数据
    const metadata = new TaskMetadata({
      priority: this.calculatePriority(goal),
      tags: this.generateTags(goal, activeTriggers),
      payload: {
        goalUuid: goal.uuid,
        goalTitle: goal.title,
        triggerTypes: activeTriggers.map((t) => t.type),
        importance: goal.importance,
        // urgency: goal.urgency, // REMOVED - priority is now computed
        priority: goal.priority, // 使用计算属性
        upcomingTriggerDates: this.calculateUpcomingTriggerDates(goal, activeTriggers),
      },
    });

    // 生成任务名称和描述
    const name = this.generateTaskName(goal);
    const description = this.generateTaskDescription(goal, activeTriggers);

    return {
      name,
      description,
      scheduleConfig,
      metadata,
      enabled: true, // Goal 提醒默认启用
    };
  }

  /**
   * 生成 cron 表达式
   *
   * 策略：
   * - 短期目标 (<30天): 每天检查2次，早上9点和晚上8点
   * - 中期目标 (30-180天): 每天早上9点检查
   * - 长期目标 (>180天): 每周一早上9点检查
   */
  private generateCronExpression(goal: GoalServerDTO): string {
    const goalDuration = this.calculateGoalDuration(goal);

    // 根据目标时长选择检查频率
    if (goalDuration === null) {
      // 无明确时长，默认每天早上9点
      return '0 0 9 * * *';
    }

    if (goalDuration < 30) {
      // 短期目标：每天早上9点和晚上8点检查
      return '0 0 9,20 * * *'; // 每天9:00和20:00
    } else if (goalDuration < 180) {
      // 中期目标：每天早上9点检查
      return '0 0 9 * * *';
    } else {
      // 长期目标：每周一早上9点检查
      return '0 0 9 * * 1'; // 每周一 9:00
    }
  }

  /**
   * 计算目标持续天数
   * @returns 天数，如果无法计算则返回 null
   */
  private calculateGoalDuration(goal: GoalServerDTO): number | null {
    if (!goal.startDate || !goal.targetDate) {
      return null;
    }

    const durationMs = goal.targetDate - goal.startDate;
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    return durationDays > 0 ? durationDays : null;
  }

  /**
   * 预计算触发器对应的关键日期，便于后续任务执行时参考
   */
  private calculateUpcomingTriggerDates(
    goal: GoalServerDTO,
    triggers: ReminderTrigger[],
  ): string[] {
    const upcomingDates: string[] = [];

    for (const trigger of triggers) {
      if (!trigger.enabled) continue;

      if (trigger.type === 'TIME_PROGRESS_PERCENTAGE') {
        const triggerDate = this.calculateTriggerDateForTimeProgress(goal, trigger);
        if (triggerDate) {
          upcomingDates.push(triggerDate.toISOString());
        }
      } else if (trigger.type === 'REMAINING_DAYS') {
        const triggerDate = this.calculateTriggerDateForRemainingDays(goal, trigger);
        if (triggerDate) {
          upcomingDates.push(triggerDate.toISOString());
        }
      }
    }

    return upcomingDates;
  }

  /**
   * 计算时间进度触发器对应的日期
   */
  private calculateTriggerDateForTimeProgress(
    goal: GoalServerDTO,
    trigger: ReminderTrigger,
  ): Date | null {
    if (!goal.startDate || !goal.targetDate || !trigger.value) {
      return null;
    }

    const totalDuration = goal.targetDate - goal.startDate;
    const triggerTime = goal.startDate + totalDuration * (trigger.value / 100);
    return triggerTime >= Date.now() ? new Date(triggerTime) : null;
  }

  /**
   * 计算剩余天数触发器对应的日期
   */
  private calculateTriggerDateForRemainingDays(
    goal: GoalServerDTO,
    trigger: ReminderTrigger,
  ): Date | null {
    if (!goal.targetDate || !trigger.value) {
      return null;
    }

    const triggerTime = goal.targetDate - trigger.value * 24 * 60 * 60 * 1000;
    return triggerTime >= Date.now() ? new Date(triggerTime) : null;
  }

  /**
   * 计算任务优先级
   * 基于 Goal 的动态 priority 计算属性（0-100）
   */
  private calculatePriority(goal: GoalServerDTO): TaskPriority {
    // 使用 Goal 的计算优先级属性进行映射
    const priority = goal.priority ?? 0;

    // priority >= 80: URGENT (CRITICAL level)
    if (priority >= 80) {
      return TaskPriority.URGENT;
    }

    // priority >= 60: HIGH
    if (priority >= 60) {
      return TaskPriority.HIGH;
    }

    // priority >= 40: NORMAL (MEDIUM level)
    if (priority >= 40) {
      return TaskPriority.NORMAL;
    }

    // priority < 40: LOW
    return TaskPriority.LOW;
  }

  /**
   * 生成任务标签
   */
  private generateTags(
    goal: GoalServerDTO,
    triggers: ReminderTrigger[],
  ): string[] {
    const tags: string[] = [
      'goal-reminder',
      `importance:${goal.importance}`,
      `priority:${goal.priority ?? 0}`, // 使用计算属性 priority
    ];

    // 添加触发器类型标签
    const triggerTypes = [...new Set(triggers.map((t) => t.type))];
    for (const type of triggerTypes) {
      if (type === 'TIME_PROGRESS_PERCENTAGE') {
        tags.push('trigger:time-progress');
      } else if (type === 'REMAINING_DAYS') {
        tags.push('trigger:remaining-days');
      }
    }

    // 添加分类标签（如果有）
    if (goal.category) {
      tags.push(`category:${goal.category}`);
    }

    return tags;
  }

  /**
   * 生成任务名称
   */
  private generateTaskName(goal: GoalServerDTO): string {
    return `Goal Reminder: ${goal.title}`;
  }

  /**
   * 生成任务描述
   */
  private generateTaskDescription(
    goal: GoalServerDTO,
    triggers: ReminderTrigger[],
  ): string {
    const triggerDescriptions = triggers.map((trigger) => {
      if (trigger.type === 'TIME_PROGRESS_PERCENTAGE') {
        return `时间进度达到 ${trigger.value}%`;
      } else if (trigger.type === 'REMAINING_DAYS') {
        return `剩余 ${trigger.value} 天`;
      }
      return `触发器: ${trigger.type}`;
    });

    return `目标提醒任务\n触发条件: ${triggerDescriptions.join(', ')}`;
  }

  /**
   * 更新调度配置（当 Goal 的 reminderConfig 变更时）
   */
  updateSchedule(
    existingSchedule: ScheduleStrategyOutput,
    input: ScheduleStrategyInput,
  ): ScheduleStrategyOutput {
    // 重新生成配置
    return this.createSchedule(input);
  }
}
