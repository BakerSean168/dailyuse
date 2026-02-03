/**
 * Reminder Module - API Contracts (CRUD + Operations)
 * 
 * 【规范说明：API 层导出】
 * 使用 Zod Schema 定义所有请求，类型通过 z.infer 推导
 * 响应类型明确指向 DTO（aggregates/entities）
 */

import { z } from 'zod';
import type { ReminderTemplateClientDTO, ReminderGroupClientDTO } from '../aggregates';

// ============================================================================
// REMINDER TEMPLATE Operations
// ============================================================================

/**
 * 创建提醒模板 Schema
 */
export const CreateReminderTemplateSchema = z.object({
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

export type CreateReminderTemplateReq = z.infer<typeof CreateReminderTemplateSchema>;
export type CreateReminderTemplateRes = ReminderTemplateClientDTO;

/**
 * 更新提醒模板 Schema
 */
export const UpdateReminderTemplateSchema = CreateReminderTemplateSchema.partial();

export type UpdateReminderTemplateReq = z.infer<typeof UpdateReminderTemplateSchema>;
export type UpdateReminderTemplateRes = ReminderTemplateClientDTO;

/**
 * 获取即将到来的提醒 Schema
 */
export const GetUpcomingRemindersSchema = z.object({
  days: z.number().int().min(1).max(365).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  importanceLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  type: z.enum(['ONE_TIME', 'RECURRING']).optional(),
});

export type GetUpcomingRemindersReq = z.infer<typeof GetUpcomingRemindersSchema>;

export interface GetUpcomingRemindersRes {
  data: ReminderTemplateClientDTO[];
  total: number;
}

// ============================================================================
// REMINDER GROUP Operations
// ============================================================================

/**
 * 创建提醒分组 Schema
 */
export const CreateReminderGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  controlMode: z.enum(['GROUP_CONTROL', 'INDIVIDUAL_CONTROL']).optional(),
  order: z.number().int().min(0).optional(),
});

export type CreateReminderGroupReq = z.infer<typeof CreateReminderGroupSchema>;
export type CreateReminderGroupRes = ReminderGroupClientDTO;

/**
 * 更新提醒分组 Schema
 */
export const UpdateReminderGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  controlMode: z.enum(['GROUP_CONTROL', 'INDIVIDUAL_CONTROL']).optional(),
  order: z.number().int().min(0).optional(),
});

export type UpdateReminderGroupReq = z.infer<typeof UpdateReminderGroupSchema>;
export type UpdateReminderGroupRes = ReminderGroupClientDTO;

/**
 * 切换分组控制模式 Schema
 */
export const SwitchGroupControlModeSchema = z.object({
  mode: z.enum(['GROUP_CONTROL', 'INDIVIDUAL_CONTROL']),
});

export type SwitchGroupControlModeReq = z.infer<typeof SwitchGroupControlModeSchema>;
export type SwitchGroupControlModeRes = ReminderGroupClientDTO;

/**
 * 批量分组操作 Schema
 */
export const BatchGroupTemplatesSchema = z.object({
  action: z.enum(['ENABLE', 'PAUSE']),
});

export type BatchGroupTemplatesReq = z.infer<typeof BatchGroupTemplatesSchema>;

export interface BatchGroupTemplatesRes {
  successCount: number;
  failedCount: number;
  errors?: Array<{
    uuid: string;
    error: string;
  }>;
}

// ============================================================================
// REMINDER OPERATION Types
// ============================================================================

export interface ReminderOperationRes {
  ok: boolean;
  message?: string;
  affectedCount?: number;
}

export interface ReminderTriggerRes {
  ok: boolean;
  triggeredAt: number;
  nextTriggerAt?: number | null;
  message?: string;
}

export interface TemplateScheduleStatusRes {
  templateUuid: string;
  hasSchedule: boolean;
  nextExecutionTime?: number | null;
  lastExecutionTime?: number | null;
  status: string;
}
