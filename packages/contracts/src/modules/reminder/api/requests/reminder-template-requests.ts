/**
 * Reminder Template API Requests
 * 提醒模板 API 请求定义
 */

import { z } from 'zod';
import { ImportanceLevel } from '../../../../shared/importance';
import type { ReminderTemplateClientDTO } from '../../aggregates';
import type { ReminderType } from '../../value-objects/reminder-type';
import type { ReminderStatus } from '../../value-objects/reminder-status';
import type {
  TriggerConfigServerDTO,
  RecurrenceConfigServerDTO,
  ActiveTimeConfigServerDTO,
  ActiveHoursConfigServerDTO,
  NotificationConfigServerDTO,
} from '../../value-objects';

// ============ Zod Schemas ============

export const CreateReminderTemplateRequestSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(['ONE_TIME', 'RECURRING']),
  trigger: z.object({
    type: z.enum(['FIXED_TIME', 'INTERVAL']),
    fixedTime: z.object({
      time: z.string(),
      timezone: z.string().nullable(),
    }).nullable(),
    interval: z.object({
      minutes: z.number().min(1),
      startTime: z.number().nullable(),
    }).nullable(),
  }),
  activeTime: z.object({
    startDate: z.number(),
    endDate: z.number().nullable(),
  }),
  notificationConfig: z.object({
    channels: z.array(z.enum(['IN_APP', 'PUSH', 'EMAIL', 'SMS'])),
    title: z.string().nullable(),
    body: z.string().nullable(),
    sound: z.object({
      enabled: z.boolean(),
      soundName: z.string().nullable(),
    }).nullable(),
    vibration: z.object({
      enabled: z.boolean(),
      pattern: z.array(z.number()).nullable(),
    }).nullable(),
    actions: z.array(z.object({
      id: z.string(),
      label: z.string(),
      action: z.enum(['DISMISS', 'SNOOZE', 'COMPLETE', 'CUSTOM']),
      customAction: z.string().nullable(),
    })).nullable(),
  }),
  description: z.string().max(1000).optional(),
  recurrence: z.object({
    type: z.enum(['DAILY', 'WEEKLY', 'CUSTOM']),
    daily: z.object({ interval: z.number().min(1) }).nullable(),
    weekly: z.object({
      interval: z.number().min(1),
      weekDays: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])),
    }).nullable(),
    customDays: z.object({ dates: z.array(z.number()) }).nullable(),
  }).optional(),
  activeHours: z.object({
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(0).max(23),
    timezone: z.string().nullable(),
  }).optional(),
  importanceLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  groupUuid: z.string().uuid().optional(),
});

export const UpdateReminderTemplateRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  trigger: z.object({
    type: z.enum(['FIXED_TIME', 'INTERVAL']),
    fixedTime: z.object({
      time: z.string(),
      timezone: z.string().nullable(),
    }).nullable(),
    interval: z.object({
      minutes: z.number().min(1),
      startTime: z.number().nullable(),
    }).nullable(),
  }).optional(),
  recurrence: z.object({
    type: z.enum(['DAILY', 'WEEKLY', 'CUSTOM']),
    daily: z.object({ interval: z.number().min(1) }).nullable(),
    weekly: z.object({
      interval: z.number().min(1),
      weekDays: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])),
    }).nullable(),
    customDays: z.object({ dates: z.array(z.number()) }).nullable(),
  }).optional(),
  activeTime: z.object({
    startDate: z.number(),
    endDate: z.number().nullable(),
  }).optional(),
  activeHours: z.object({
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(0).max(23),
    timezone: z.string().nullable(),
  }).optional(),
  notificationConfig: z.object({
    channels: z.array(z.enum(['IN_APP', 'PUSH', 'EMAIL', 'SMS'])),
    title: z.string().nullable(),
    body: z.string().nullable(),
    sound: z.object({
      enabled: z.boolean(),
      soundName: z.string().nullable(),
    }).nullable(),
    vibration: z.object({
      enabled: z.boolean(),
      pattern: z.array(z.number()).nullable(),
    }).nullable(),
    actions: z.array(z.object({
      id: z.string(),
      label: z.string(),
      action: z.enum(['DISMISS', 'SNOOZE', 'COMPLETE', 'CUSTOM']),
      customAction: z.string().nullable(),
    })).nullable(),
  }).optional(),
  importanceLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  groupUuid: z.string().uuid().optional(),
});

export const QueryReminderTemplatesRequestSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'DISABLED', 'EXPIRED']).optional(),
  type: z.enum(['ONE_TIME', 'RECURRING']).optional(),
  groupUuid: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  importanceLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  effectiveEnabled: z.boolean().optional(),
});

// ============ Request Types ============

/**
 * 创建提醒模板请求
 */
export interface CreateReminderTemplateRequest {
  title: string;
  type: ReminderType;
  trigger: TriggerConfigServerDTO;
  activeTime: ActiveTimeConfigServerDTO;
  notificationConfig: NotificationConfigServerDTO;
  description?: string;
  recurrence?: RecurrenceConfigServerDTO;
  activeHours?: ActiveHoursConfigServerDTO;
  importanceLevel?: ImportanceLevel;
  tags?: string[];
  color?: string;
  icon?: string;
  groupUuid?: string;
}

/**
 * 更新提醒模板请求
 */
export interface UpdateReminderTemplateRequest {
  title?: string;
  description?: string;
  trigger?: TriggerConfigServerDTO;
  recurrence?: RecurrenceConfigServerDTO;
  activeTime?: ActiveTimeConfigServerDTO;
  activeHours?: ActiveHoursConfigServerDTO;
  notificationConfig?: NotificationConfigServerDTO;
  importanceLevel?: ImportanceLevel;
  tags?: string[];
  color?: string;
  icon?: string;
  groupUuid?: string;
}

/**
 * 查询提醒模板请求
 */
export interface QueryReminderTemplatesRequest {
  status?: ReminderStatus;
  type?: ReminderType;
  groupUuid?: string;
  tags?: string[];
  importanceLevel?: ImportanceLevel;
  effectiveEnabled?: boolean;
}

// ============ Response Types ============

/**
 * 提醒模板详情响应（单个）
 */
export type ReminderTemplateDTO = ReminderTemplateClientDTO;

/**
 * 提醒模板列表响应
 */
export interface ReminderTemplateListDTO {
  templates: ReminderTemplateClientDTO[];
  total: number;
  page?: number;
  pageSize?: number;
}
