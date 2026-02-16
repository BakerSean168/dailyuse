/**
 * Reminder Template Operations
 * 
 * This file contains DTOs for managing reminder templates.
 * Reminder templates define the structure and triggering rules for reminders.
 */

import { z } from 'zod';
import type { ReminderTemplateClientDTO } from '../aggregates';

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
  groupId: z.string().uuid().optional(),
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
