/**
 * UpcomingReminderCalculationService - 即将到来的提醒计算服务
 *
 * 职责：
 * - 计算指定时间范围内的提醒触发时间
 * - 支持各种类型的提醒（一次性、循环、间隔）
 * - 支持过滤和排序
 *
 * @architecture
 * - 领域服务层（Domain Service）
 * - 纯函数式设计，无状态
 * - 与业务逻辑耦合最小化
 */

import {
  ReminderType,
  ReminderStatus,
  TriggerType,
  RecurrenceType,
} from '@dailyuse/contracts/reminder';
import type {
  FixedTimeTrigger,
  IntervalTrigger,
  RecurrenceConfigServerDTO,
  ReminderTemplateServerDTO,
  TriggerConfigServerDTO,
} from '@dailyuse/contracts/reminder';
import { WeekDay } from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

const REMINDER_CALCULATION_DEBUG =
  typeof process !== 'undefined' && process.env.DEBUG_REMINDER_CALCULATION === 'true';

function debugUpcomingReminderCalculation(message: string, payload?: unknown): void {
  if (!REMINDER_CALCULATION_DEBUG) {
    return;
  }

  if (payload === undefined) {
    console.log(message);
    return;
  }

  console.log(message, payload);
}

/**
 * 即将到来的提醒 DTO（前端友好）
 */
export interface UpcomingReminderDTO {
  // 提醒信息
  templateId: string;
  title: string;
  description?: string;
  type: ReminderType;
  triggerType: string;
  importanceLevel: ImportanceLevel;

  // 触发时间
  nextTriggerAt: number; // epoch ms
  nextTriggerDisplay: string; // 人类可读的格式 "2025-11-18 16:30"
  daysUntilTrigger: number; // 距离现在的天数

  // 显示属性
  icon: string;
  color: string;

  // 通知配置
  notificationChannels: string[];

  // 分组信息
  groupId?: string | null;
}

/**
 * 即将到来的提醒计算服务
 */
export class UpcomingReminderCalculationService {
  /**
   * 计算即将到来的提醒列表
   *
   * @param reminders 启用的提醒模板列表
   * @param options 计算选项
   * @returns 即将到来的提醒 DTO 数组（已排序）
   */
  static calculateUpcomingReminders(
    reminders: ReminderTemplateServerDTO[],
    options: {
      days?: number; // 向后查看天数，默认 1（今天内）
      limit?: number; // 返回的最大条数，默认 50
      afterTime?: number; // 从某个时间之后开始，默认当前时间
    } = {},
  ): UpcomingReminderDTO[] {
    const {
      days = 1, // 默认今天内
      limit = 50,
      afterTime = Date.now(),
    } = options;

    debugUpcomingReminderCalculation('📊 [UpcomingReminderCalculation] 开始计算', {
      remindersCount: reminders.length,
      days,
      limit,
      afterTime: new Date(afterTime).toISOString(),
      endTime: new Date(afterTime + days * 24 * 60 * 60 * 1000).toISOString(),
    });

    // 计算查询范围
    const endTime = afterTime + days * 24 * 60 * 60 * 1000;

    const upcomingReminders: UpcomingReminderDTO[] = [];

    // 为每个提醒计算接下来的触发时间
    for (const reminder of reminders) {
      debugUpcomingReminderCalculation(
        `📝 [UpcomingReminderCalculation] 处理提醒: ${reminder.name}`,
        {
          id: reminder.id,
          type: reminder.type,
          triggerType: reminder.trigger.type,
          selfEnabled: reminder.selfEnabled,
          status: reminder.status,
          nextTriggerAt: reminder.nextTriggerAt
            ? new Date(reminder.nextTriggerAt).toISOString()
            : null,
          activeTime: {
            activatedAt: new Date(reminder.activeTime.activatedAt).toISOString(),
          },
        },
      );

      // 检查该提醒是否已经有计算的 nextTriggerAt 且在范围内
      if (
        reminder.nextTriggerAt &&
        reminder.nextTriggerAt >= afterTime &&
        reminder.nextTriggerAt <= endTime
      ) {
        debugUpcomingReminderCalculation(
          `✅ [UpcomingReminderCalculation] 使用已有的 nextTriggerAt: ${reminder.name}`,
          {
            nextTriggerAt: new Date(reminder.nextTriggerAt).toISOString(),
          },
        );
        const dto = this.convertToUpcomingDTO(reminder, afterTime);
        if (dto) {
          upcomingReminders.push(dto);
        }
      } else {
        // nextTriggerAt 不存在、已过期、或超出范围 -> 重新计算
        const reason = !reminder.nextTriggerAt
          ? '没有 nextTriggerAt'
          : reminder.nextTriggerAt < afterTime
            ? 'nextTriggerAt 已过期'
            : 'nextTriggerAt 超出范围';

        debugUpcomingReminderCalculation(
          `🔍 [UpcomingReminderCalculation] 重新计算触发时间: ${reminder.name}`,
          {
            reason,
            oldNextTriggerAt: reminder.nextTriggerAt
              ? new Date(reminder.nextTriggerAt).toISOString()
              : null,
          },
        );

        const nextTrigger = this.calculateNextTriggerTime(reminder, afterTime);
        debugUpcomingReminderCalculation(
          `🔍 [UpcomingReminderCalculation] 计算结果: ${reminder.name}`,
          {
            nextTrigger: nextTrigger ? new Date(nextTrigger).toISOString() : null,
            inRange: nextTrigger ? nextTrigger >= afterTime && nextTrigger <= endTime : false,
          },
        );

        if (nextTrigger && nextTrigger >= afterTime && nextTrigger <= endTime) {
          const dto = this.convertToUpcomingDTO(
            { ...reminder, nextTriggerAt: nextTrigger },
            afterTime,
          );
          if (dto) {
            upcomingReminders.push(dto);
          }
        } else if (nextTrigger) {
          debugUpcomingReminderCalculation(
            `⚠️  [UpcomingReminderCalculation] 计算的 nextTrigger 也超出范围: ${reminder.name}`,
            {
              nextTrigger: new Date(nextTrigger).toISOString(),
              afterTime: new Date(afterTime).toISOString(),
              endTime: new Date(endTime).toISOString(),
            },
          );
        }
      }
    }

    // 按触发时间排序
    upcomingReminders.sort((a, b) => a.nextTriggerAt - b.nextTriggerAt);

    // 限制返回的数量
    return upcomingReminders.slice(0, limit);
  }

  /**
   * 计算单个提醒的下一次触发时间
   *
   * @param reminder 提醒模板
   * @param afterTime 从这个时间之后开始查找，默认当前时间
   * @returns 下一次触发的时间戳（epoch ms），如果不需要触发则返回 null
   */
  static calculateNextTriggerTime(
    reminder: ReminderTemplateServerDTO,
    afterTime: number = Date.now(),
  ): number | null {
    try {
      // 检查提醒是否已启用且激活
      if (!reminder.selfEnabled || reminder.status !== ReminderStatus.Active) {
        return null;
      }

      // 检查提醒是否在活跃期内
      const activeTime = reminder.activeTime;
      if (afterTime < activeTime.activatedAt) {
        // 还未到激活时间
        return activeTime.activatedAt;
      }
      // 重构后：移除 endDate 检查，生效控制由 status 字段负责

      // 根据提醒类型计算
      if (reminder.type === ReminderType.OneTime) {
        return this.calculateOneTimeTrigger(reminder, afterTime);
      } else if (reminder.type === ReminderType.Recurring) {
        return this.calculateRecurringTrigger(reminder, afterTime);
      }

      return null;
    } catch (error) {
      console.error(`[UpcomingReminderCalculationService] 计算提醒 ${reminder.id} 失败:`, error);
      return null;
    }
  }

  /**
   * 计算一次性提醒的触发时间
   */
  private static calculateOneTimeTrigger(
    reminder: ReminderTemplateServerDTO,
    afterTime: number,
  ): number | null {
    const trigger = reminder.trigger as TriggerConfigServerDTO;

    if (trigger.type === TriggerType.FixedTime && trigger.fixedTime) {
      // 一次性固定时间提醒
      // 从 activeTime.activatedAt 的日期 + fixedTime 的时间
      const dateObj = new Date(reminder.activeTime.activatedAt);
      const [hourStr, minuteStr] = trigger.fixedTime.time.split(':');
      dateObj.setHours(parseInt(hourStr, 10), parseInt(minuteStr, 10), 0, 0);
      const triggerTime = dateObj.getTime();

      if (triggerTime >= afterTime) {
        return triggerTime;
      }
    }

    return null;
  }

  /**
   * 计算循环提醒的触发时间
   */
  private static calculateRecurringTrigger(
    reminder: ReminderTemplateServerDTO,
    afterTime: number,
  ): number | null {
    const trigger = reminder.trigger as TriggerConfigServerDTO;

    if (trigger.type === TriggerType.FixedTime && trigger.fixedTime) {
      return this.calculateNextFixedTimeTrigger(reminder, trigger.fixedTime, afterTime);
    } else if (trigger.type === TriggerType.Interval && trigger.interval) {
      return this.calculateNextIntervalTrigger(reminder, trigger.interval, afterTime);
    }

    return null;
  }

  /**
   * 计算下一次固定时间触发
   */
  private static calculateNextFixedTimeTrigger(
    reminder: ReminderTemplateServerDTO,
    fixedTime: FixedTimeTrigger,
    afterTime: number,
  ): number | null {
    const recurrence = reminder.recurrence;
    const [hourStr, minuteStr] = fixedTime.time.split(':');
    const targetHour = parseInt(hourStr, 10);
    const targetMinute = parseInt(minuteStr, 10);

    // 从 afterTime 开始查找
    const searchStartDate = new Date(afterTime);
    searchStartDate.setHours(0, 0, 0, 0);

    // 最多查找 365 天
    for (let daysOffset = 0; daysOffset < 365; daysOffset++) {
      const checkDate = new Date(searchStartDate);
      checkDate.setDate(checkDate.getDate() + daysOffset);

      // 检查该日期是否应该触发
      if (this.shouldTriggerOnDate(checkDate, recurrence, reminder.activeTime.activatedAt)) {
        checkDate.setHours(targetHour, targetMinute, 0, 0);
        const triggerTime = checkDate.getTime();

        if (triggerTime >= afterTime) {
          return triggerTime;
        }
      }
    }

    return null;
  }

  /**
   * 检查指定日期是否应该根据重复规则触发
   */
  private static shouldTriggerOnDate(
    date: Date,
    recurrence: RecurrenceConfigServerDTO | null | undefined,
    reminderStartDate: number,
  ): boolean {
    // 如果没有重复规则，默认每天都应该触发
    if (!recurrence) {
      return true;
    }

    switch (recurrence.type) {
      case RecurrenceType.Daily: {
        // 每 N 天
        if (recurrence.daily?.interval) {
          // 从提醒的开始日期开始计算间隔
          const startDate = new Date(reminderStartDate);
          startDate.setHours(0, 0, 0, 0);
          const daysDiff = Math.floor(
            (date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
          );
          return daysDiff % recurrence.daily.interval === 0;
        }
        return true;
      }

      case RecurrenceType.Weekly: {
        if (recurrence.weekly?.weekDays) {
          const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
          // 转换为 Monday=0, Tuesday=1, ..., Sunday=6
          const mappedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const weekDayMap: Record<WeekDay, number> = {
            [WeekDay.Monday]: 0,
            [WeekDay.Tuesday]: 1,
            [WeekDay.Wednesday]: 2,
            [WeekDay.Thursday]: 3,
            [WeekDay.Friday]: 4,
            [WeekDay.Saturday]: 5,
            [WeekDay.Sunday]: 6,
          };
          return recurrence.weekly.weekDays.some((day) => weekDayMap[day] === mappedDay);
        }
        return true;
      }

      case RecurrenceType.CustomDays: {
        if (recurrence.customDays?.dates) {
          const checkDate = new Date(date);
          checkDate.setHours(0, 0, 0, 0);
          const checkDateMs = checkDate.getTime();

          // 比较日期（忽略时间）
          return recurrence.customDays.dates.some((dateMs) => {
            const d = new Date(dateMs);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === checkDateMs;
          });
        }
        return true;
      }

      default:
        return true;
    }
  }

  /**
   * 计算下一次间隔触发
   */
  private static calculateNextIntervalTrigger(
    reminder: ReminderTemplateServerDTO,
    interval: IntervalTrigger,
    afterTime: number,
  ): number | null {
    const intervalMs = interval.minutes * 60 * 1000;
    const startTime = reminder.activeTime.activatedAt;

    debugUpcomingReminderCalculation(`🔢 [calculateNextIntervalTrigger] 计算间隔触发`, {
      name: reminder.name,
      intervalMinutes: interval.minutes,
      intervalMs,
      startTime: new Date(startTime).toISOString(),
      afterTime: new Date(afterTime).toISOString(),
    });

    // 从激活时间开始，每隔 N 分钟触发一次
    const elapsed = afterTime - startTime;
    const nextIntervalCount = Math.ceil(elapsed / intervalMs);
    const nextTriggerTime = startTime + nextIntervalCount * intervalMs;

    debugUpcomingReminderCalculation(`🔢 [calculateNextIntervalTrigger] 计算详情`, {
      name: reminder.name,
      elapsed: `${elapsed}ms (${Math.floor(elapsed / 1000 / 60)}分钟)`,
      nextIntervalCount,
      nextTriggerTime: new Date(nextTriggerTime).toISOString(),
      nextTriggerTimeMs: nextTriggerTime,
    });

    // 重构后：移除 endDate 检查，生效控制由 status 字段负责
    debugUpcomingReminderCalculation(
      `✅ [calculateNextIntervalTrigger] 返回下次触发时间: ${reminder.name}`,
      {
        nextTriggerTime: new Date(nextTriggerTime).toISOString(),
      },
    );
    return nextTriggerTime;
  }

  /**
   * 将 ReminderTemplate 转换为前端友好的 UpcomingReminder DTO
   */
  private static convertToUpcomingDTO(
    reminder: ReminderTemplateServerDTO,
    baseTime: number = Date.now(),
  ): UpcomingReminderDTO | null {
    if (!reminder.nextTriggerAt) {
      return null;
    }

    const nextTriggerAt = reminder.nextTriggerAt;
    const daysUntilTrigger = Math.ceil((nextTriggerAt - baseTime) / (24 * 60 * 60 * 1000));

    return {
      templateId: reminder.id,
      title: reminder.name,
      description: reminder.description ?? undefined,
      type: reminder.type,
      triggerType: reminder.trigger.type,
      importanceLevel: reminder.importanceLevel,
      nextTriggerAt,
      nextTriggerDisplay: this.formatDateTime(nextTriggerAt),
      daysUntilTrigger,
      icon: reminder.icon || 'mdi-bell',
      color: reminder.color || '#1976D2',
      notificationChannels: reminder.notificationConfig?.channels || [],
      groupId: reminder.groupId ?? undefined,
    };
  }

  /**
   * 格式化时间戳为可读字符串
   */
  private static formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  /**
   * 计算今日内所有提醒的所有触发时间点（作息时间表）
   * 返回一个完整的今日时间表，包含所有提醒的触发时间
   *
   * @param reminders 启用的提醒模板列表
   * @param options 计算选项
   * @returns 今日内所有触发时间点的完整列表（按时间排序）
   */
  static calculateTodaySchedule(
    reminders: ReminderTemplateServerDTO[],
    options: {
      maxItemsPerReminder?: number; // 每个提醒最多显示多少个触发点，默认 20
      includeExpired?: boolean; // 是否包含已过期的时间点，默认 false
    } = {},
  ): UpcomingReminderDTO[] {
    const { maxItemsPerReminder = 20, includeExpired = false } = options;

    const now = Date.now();

    // 获取今天的开始和结束时间
    const todayStart = this.getTodayStart(now);
    const todayEnd = this.getTodayEnd(now);

    debugUpcomingReminderCalculation('📅 [calculateTodaySchedule] 计算今日作息表', {
      todayStart: new Date(todayStart).toISOString(),
      todayEnd: new Date(todayEnd).toISOString(),
      now: new Date(now).toISOString(),
      remindersCount: reminders.length,
      includeExpired,
    });

    const allTriggerTimes: UpcomingReminderDTO[] = [];

    // 为每个提醒计算今天的所有触发时间
    for (const reminder of reminders) {
      // 检查提醒是否启用且在活跃期内
      if (!reminder.selfEnabled || reminder.status !== ReminderStatus.Active) {
        continue;
      }

      // 检查提醒是否在活跃期内（今天）
      if (reminder.activeTime.activatedAt > todayEnd) {
        debugUpcomingReminderCalculation(
          `⏭️  [calculateTodaySchedule] 提醒还未激活: ${reminder.name}`,
          {
            activatedAt: new Date(reminder.activeTime.activatedAt).toISOString(),
          },
        );
        continue;
      }
      // 重构后：移除 endDate 检查，生效控制由 status 字段负责

      // 计算该提醒在今天的所有触发时间
      const todayTriggerTimes = this.calculateReminderTriggerTimesToday(
        reminder,
        todayStart,
        todayEnd,
        maxItemsPerReminder,
      );

      debugUpcomingReminderCalculation(
        `📍 [calculateTodaySchedule] ${reminder.name} 在今天的触发次数: ${todayTriggerTimes.length}`,
        {
          times: todayTriggerTimes.map((dto) => dto.nextTriggerDisplay),
        },
      );

      allTriggerTimes.push(...todayTriggerTimes);
    }

    debugUpcomingReminderCalculation(
      `📊 [calculateTodaySchedule] 总计算出 ${allTriggerTimes.length} 个时间点`,
    );

    // 按时间排序
    allTriggerTimes.sort((a, b) => a.nextTriggerAt - b.nextTriggerAt);

    // 如果不包含过期时间点，进行过滤
    if (!includeExpired) {
      const filtered = allTriggerTimes.filter((item) => item.nextTriggerAt >= now);
      debugUpcomingReminderCalculation(`🔄 [calculateTodaySchedule] 过滤过期时间点`, {
        总数: allTriggerTimes.length,
        过滤后: filtered.length,
      });
      return filtered;
    }

    return allTriggerTimes;
  }

  /**
   * 计算单个提醒在今天的所有触发时间
   */
  private static calculateReminderTriggerTimesToday(
    reminder: ReminderTemplateServerDTO,
    todayStart: number,
    todayEnd: number,
    maxItems: number,
  ): UpcomingReminderDTO[] {
    const result: UpcomingReminderDTO[] = [];
    const trigger = reminder.trigger as TriggerConfigServerDTO;

    if (trigger.type === TriggerType.FixedTime && trigger.fixedTime) {
      // 固定时间触发：在今天的特定时间触发
      const triggerTimes = this.generateFixedTimeTriggersForToday(
        reminder,
        trigger.fixedTime,
        todayStart,
        todayEnd,
      );
      result.push(...triggerTimes.slice(0, maxItems));
    } else if (trigger.type === TriggerType.Interval && trigger.interval) {
      // 间隔触发：在今天的多个时间点触发
      const triggerTimes = this.generateIntervalTriggersForToday(
        reminder,
        trigger.interval,
        todayStart,
        todayEnd,
        maxItems,
      );
      result.push(...triggerTimes);
    }

    return result;
  }

  /**
   * 生成固定时间在今天的触发时间
   */
  private static generateFixedTimeTriggersForToday(
    reminder: ReminderTemplateServerDTO,
    fixedTime: FixedTimeTrigger,
    todayStart: number,
    todayEnd: number,
  ): UpcomingReminderDTO[] {
    const result: UpcomingReminderDTO[] = [];
    const recurrence = reminder.recurrence;

    const [hourStr, minuteStr] = fixedTime.time.split(':');
    const targetHour = parseInt(hourStr, 10);
    const targetMinute = parseInt(minuteStr, 10);

    // 使用北京时间
    const offset = 8 * 60 * 60 * 1000; // +8 小时
    const checkDate = new Date(todayStart + offset);
    checkDate.setUTCHours(0, 0, 0, 0);

    // 检查今天是否应该根据重复规则触发
    if (this.shouldTriggerOnDate(checkDate, recurrence, reminder.activeTime.activatedAt)) {
      checkDate.setUTCHours(targetHour, targetMinute, 0, 0);
      const triggerTime = checkDate.getTime() - offset; // 转回 UTC 时间戳

      if (triggerTime >= todayStart && triggerTime <= todayEnd) {
        const dto = this.convertToUpcomingDTO(
          { ...reminder, nextTriggerAt: triggerTime },
          Date.now(),
        );
        if (dto) {
          result.push(dto);
        }
      }
    }

    return result;
  }

  /**
   * 生成间隔触发在今天的所有时间点
   */
  private static generateIntervalTriggersForToday(
    reminder: ReminderTemplateServerDTO,
    interval: IntervalTrigger,
    todayStart: number,
    todayEnd: number,
    maxItems: number,
  ): UpcomingReminderDTO[] {
    const result: UpcomingReminderDTO[] = [];
    const intervalMs = interval.minutes * 60 * 1000;
    const reminderStartTime = reminder.activeTime.activatedAt;

    debugUpcomingReminderCalculation(`⏰ [generateIntervalTriggersForToday] ${reminder.name}`, {
      intervalMinutes: interval.minutes,
      reminderStartTime: new Date(reminderStartTime).toISOString(),
      todayStart: new Date(todayStart).toISOString(),
      todayEnd: new Date(todayEnd).toISOString(),
    });

    // 计算从提醒开始时间到今天开始的间隔数
    const elapsedSinceReminder = todayStart - reminderStartTime;
    const firstIntervalCount = Math.max(0, Math.ceil(elapsedSinceReminder / intervalMs));

    // 生成今天所有的触发时间
    let currentIntervalCount = firstIntervalCount;
    while (result.length < maxItems) {
      const triggerTime = reminderStartTime + currentIntervalCount * intervalMs;

      // 如果超出今天范围，停止
      if (triggerTime > todayEnd) {
        break;
      }

      // 如果在今天范围内，添加到结果
      if (triggerTime >= todayStart && triggerTime <= todayEnd) {
        const dto = this.convertToUpcomingDTO(
          { ...reminder, nextTriggerAt: triggerTime },
          Date.now(),
        );
        if (dto) {
          result.push(dto);
        }
      }

      currentIntervalCount++;
    }

    debugUpcomingReminderCalculation(
      `✅ [generateIntervalTriggersForToday] ${reminder.name} 生成 ${result.length} 个触发点`,
      {
        times: result.map((r) => r.nextTriggerDisplay),
      },
    );
    return result;
  }

  /**
   * 获取今天的开始时间（00:00:00 北京时间）
   */
  private static getTodayStart(timestamp: number = Date.now()): number {
    // 北京时间 GMT+8
    const date = new Date(timestamp);
    const offset = 8 * 60 * 60 * 1000; // +8 小时偏移
    const beijingTime = new Date(date.getTime() + offset);
    beijingTime.setUTCHours(0, 0, 0, 0);
    return beijingTime.getTime() - offset; // 转回 UTC 时间戳
  }

  /**
   * 获取今天的结束时间（23:59:59.999 北京时间）
   */
  private static getTodayEnd(timestamp: number = Date.now()): number {
    // 北京时间 GMT+8
    const date = new Date(timestamp);
    const offset = 8 * 60 * 60 * 1000; // +8 小时偏移
    const beijingTime = new Date(date.getTime() + offset);
    beijingTime.setUTCHours(23, 59, 59, 999);
    return beijingTime.getTime() - offset; // 转回 UTC 时间戳
  }
}
