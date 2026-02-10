// @ts-nocheck - This file uses old ReminderTemplate API structure
import type { ReminderTemplate } from '@dailyuse/reminder/domain-client';
import { ReminderTemplateStatus } from '@dailyuse/contracts/reminder';
import type { ReminderTemplateClientDTO, ReminderInstanceClientDTO } from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import {
  addDays,
  addWeeks,
  addMonths,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  isAfter,
  isBefore,
  parseISO,
  format,
} from 'date-fns';

/**
 * 即将到来的提醒项
 */
export interface UpcomingReminder {
  templateUuid: string;
  templateName: string;
  message: string;
  scheduledTime: Date;
  importanceLevel: ImportanceLevel;
  color?: string;
  icon?: string;
  category: string;
}

/**
 * 计算即将到来的提醒
 *
 * @param templates - 提醒模板列表
 * @param options - 计算选项
 * @returns 即将到来的提醒列表（按时间排序）
 */
export function calculateUpcomingReminders(
  templates: ReminderTemplate[],
  options: {
    /** 时间范围（分钟），默认 24 小时 */
    withinMinutes?: number;
    /** 最大返回数量 */
    limit?: number;
    /** 只包含启用的模板 */
    enabledOnly?: boolean;
  } = {},
): UpcomingReminder[] {
  const {
    withinMinutes = 60 * 24, // 默认 24 小时
    limit = 50,
    enabledOnly = true,
  } = options;

  const now = new Date();
  const endTime = new Date(now.getTime() + withinMinutes * 60 * 1000);

  const upcomingReminders: UpcomingReminder[] = [];

  // 过滤启用的模板
  const activeTemplates = enabledOnly ? templates.filter((t) => t.enabled) : templates;

  for (const template of activeTemplates) {
    const { timeConfig } = template;

    if (!timeConfig) continue;

    switch (timeConfig.type) {
      case ReminderTimeConfigType.DAILY:
        upcomingReminders.push(...calculateDailyReminders(template, now, endTime));
        break;

      case ReminderTimeConfigType.WEEKLY:
        upcomingReminders.push(...calculateWeeklyReminders(template, now, endTime));
        break;

      case ReminderTimeConfigType.MONTHLY:
        upcomingReminders.push(...calculateMonthlyReminders(template, now, endTime));
        break;

      case ReminderTimeConfigType.CUSTOM:
        // 自定义提醒需要特殊处理，暂不支持
        break;
    }
  }

  // 按时间排序并限制数量
  return upcomingReminders
    .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
    .slice(0, limit);
}

/**
 * 计算每日提醒
 */
function calculateDailyReminders(
  template: ReminderTemplate,
  startTime: Date,
  endTime: Date,
): UpcomingReminder[] {
  const reminders: UpcomingReminder[] = [];
  const { timeConfig } = template;

  if (timeConfig.type !== ReminderTimeConfigType.DAILY || !timeConfig.times) {
    return reminders;
  }

  for (const timeStr of timeConfig.times) {
    const [hours, minutes] = timeStr.split(':').map(Number);

    // 今天的提醒时间
    let scheduledTime = setMilliseconds(
      setSeconds(setMinutes(setHours(new Date(startTime), hours), minutes), 0),
      0,
    );

    // 如果今天的时间已过，计算明天的
    if (isBefore(scheduledTime, startTime)) {
      scheduledTime = addDays(scheduledTime, 1);
    }

    // 检查是否在时间范围内
    if (isAfter(scheduledTime, startTime) && isBefore(scheduledTime, endTime)) {
      reminders.push(createUpcomingReminder(template, scheduledTime));
    }

    // 如果时间范围超过 24 小时，添加后续的提醒
    let nextDay = addDays(scheduledTime, 1);
    while (isBefore(nextDay, endTime)) {
      reminders.push(createUpcomingReminder(template, nextDay));
      nextDay = addDays(nextDay, 1);
    }
  }

  return reminders;
}

/**
 * 计算每周提醒
 */
function calculateWeeklyReminders(
  template: ReminderTemplate,
  startTime: Date,
  endTime: Date,
): UpcomingReminder[] {
  const reminders: UpcomingReminder[] = [];
  const { timeConfig } = template;

  if (
    timeConfig.type !== ReminderTimeConfigType.WEEKLY ||
    !timeConfig.weekdays ||
    !timeConfig.times
  ) {
    return reminders;
  }

  const currentDay = startTime.getDay(); // 0 = Sunday, 1 = Monday, ...

  for (const dayOfWeek of timeConfig.weekdays) {
    for (const timeStr of timeConfig.times) {
      const [hours, minutes] = timeStr.split(':').map(Number);

      // 计算本周该天的提醒时间
      let daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
      if (daysUntilTarget === 0) {
        // 今天就是目标日
        const todayTime = setMilliseconds(
          setSeconds(setMinutes(setHours(new Date(startTime), hours), minutes), 0),
          0,
        );
        if (isBefore(todayTime, startTime)) {
          // 今天的时间已过，使用下周
          daysUntilTarget = 7;
        }
      }

      const scheduledTime = addDays(
        setMilliseconds(
          setSeconds(setMinutes(setHours(new Date(startTime), hours), minutes), 0),
          0,
        ),
        daysUntilTarget,
      );

      // 检查是否在时间范围内
      if (isAfter(scheduledTime, startTime) && isBefore(scheduledTime, endTime)) {
        reminders.push(createUpcomingReminder(template, scheduledTime));
      }

      // 添加后续周的提醒
      let nextWeek = addWeeks(scheduledTime, 1);
      while (isBefore(nextWeek, endTime)) {
        reminders.push(createUpcomingReminder(template, nextWeek));
        nextWeek = addWeeks(nextWeek, 1);
      }
    }
  }

  return reminders;
}

/**
 * 计算每月提醒
 */
function calculateMonthlyReminders(
  template: ReminderTemplate,
  startTime: Date,
  endTime: Date,
): UpcomingReminder[] {
  const reminders: UpcomingReminder[] = [];
  const { timeConfig } = template;

  if (
    timeConfig.type !== ReminderTimeConfigType.MONTHLY ||
    !timeConfig.monthDays ||
    !timeConfig.times
  ) {
    return reminders;
  }

  for (const dayOfMonth of timeConfig.monthDays) {
    for (const timeStr of timeConfig.times) {
      const [hours, minutes] = timeStr.split(':').map(Number);

      // 本月的提醒时间
      let scheduledTime = setMilliseconds(
        setSeconds(
          setMinutes(
            setHours(new Date(startTime.getFullYear(), startTime.getMonth(), dayOfMonth), hours),
            minutes,
          ),
          0,
        ),
        0,
      );

      // 如果本月的时间已过，使用下月
      if (isBefore(scheduledTime, startTime)) {
        scheduledTime = addMonths(scheduledTime, 1);
      }

      // 检查是否在时间范围内
      if (isAfter(scheduledTime, startTime) && isBefore(scheduledTime, endTime)) {
        reminders.push(createUpcomingReminder(template, scheduledTime));
      }

      // 添加后续月的提醒
      let nextMonth = addMonths(scheduledTime, 1);
      while (isBefore(nextMonth, endTime)) {
        reminders.push(createUpcomingReminder(template, nextMonth));
        nextMonth = addMonths(nextMonth, 1);
      }
    }
  }

  return reminders;
}

/**
 * 创建 UpcomingReminder 对象
 */
function createUpcomingReminder(template: ReminderTemplate, scheduledTime: Date): UpcomingReminder {
  return {
    templateUuid: template.uuid,
    templateName: template.name,
    message: template.message,
    scheduledTime,
    priority: template.priority,
    color: template.color,
    icon: template.icon,
    category: template.category,
  };
}

/**
 * 格式化即将到来的提醒为显示文本
 */
export function formatUpcomingReminder(reminder: UpcomingReminder): string {
  const timeStr = format(reminder.scheduledTime, 'yyyy-MM-dd HH:mm');
  return `${timeStr} - ${reminder.templateName}: ${reminder.message}`;
}

/**
 * 按优先级分组即将到来的提醒
 */
export function groupByImportance(
  reminders: UpcomingReminder[],
): Record<ImportanceLevel, UpcomingReminder[]> {
  return reminders.reduce(
    (acc, reminder) => {
      if (!acc[reminder.importanceLevel]) {
        acc[reminder.importanceLevel] = [];
      }
      acc[reminder.importanceLevel].push(reminder);
      return acc;
    },
    {} as Record<ImportanceLevel, UpcomingReminder[]>,
  );
}

/**
 * 按类别分组即将到来的提醒
 */
export function groupByCategory(reminders: UpcomingReminder[]): Record<string, UpcomingReminder[]> {
  return reminders.reduce(
    (acc, reminder) => {
      const category = reminder.category || '未分类';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(reminder);
      return acc;
    },
    {} as Record<string, UpcomingReminder[]>,
  );
}

