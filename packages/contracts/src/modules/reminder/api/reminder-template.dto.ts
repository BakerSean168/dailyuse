/**
 * Reminder Template Operations
 *
 * This file contains DTOs for managing reminder templates.
 * Reminder templates define the structure and triggering rules for reminders.
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { ReminderGroupId, ReminderTemplateId } from '../../../primitives';
import type { ReminderTemplateClientDTO } from '../aggregates/reminder-template-client';
import { ReminderType } from '../value-objects/reminder-type';
import { TriggerType } from '../value-objects/trigger-type';
import { NotificationChannel } from '../value-objects/notification-channel';
import { NotificationAction } from '../value-objects/notification-action';
import { ImportanceLevel } from '../../../shared/value-objects/importance';

// ============================================================================
// REMINDER TEMPLATE Operations
// ============================================================================

/**
 * 创建提醒模板 Schema
 */
export const CreateReminderTemplateSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(ReminderType),
  trigger: z.object({
    type: z.enum(TriggerType),
    fixedTime: z
      .object({
        time: z.string(),
        timezone: z.string().nullable(),
      })
      .nullable(),
    interval: z
      .object({
        minutes: z.number().min(1),
        startTime: z.number().nullable(),
      })
      .nullable(),
  }),
  activeTime: z.object({
    startDate: z.number(),
    endDate: z.number().nullable(),
  }),
  notificationConfig: z.object({
    channels: z.array(z.enum(NotificationChannel)),
    title: z.string().nullable(),
    body: z.string().nullable(),
    sound: z
      .object({
        enabled: z.boolean(),
        soundName: z.string().nullable(),
      })
      .nullable(),
    vibration: z
      .object({
        enabled: z.boolean(),
        pattern: z.array(z.number()).nullable(),
      })
      .nullable(),
    actions: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          action: z.enum(NotificationAction),
          customAction: z.string().nullable(),
        }),
      )
      .nullable(),
  }),
  description: z.string().max(1000).optional(),
  activeHours: z
    .object({
      startHour: z.number().min(0).max(23),
      endHour: z.number().min(0).max(23),
      timezone: z.string().nullable(),
    })
    .optional(),
  importanceLevel: z.enum(ImportanceLevel).optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  groupId: brandedId<ReminderGroupId>().optional(),
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
  importanceLevel: z.enum(ImportanceLevel).optional(),
  type: z.enum(ReminderType).optional(),
});

export type GetUpcomingRemindersReq = z.infer<typeof GetUpcomingRemindersSchema>;

export interface GetUpcomingRemindersRes {
  data: ReminderTodayScheduleItem[];
  total: number;
}

export const ReminderTodayScheduleItemSchema = z.object({
  templateId: brandedId<ReminderTemplateId>(),
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(ReminderType),
  triggerType: z.enum(TriggerType),
  importanceLevel: z.enum(ImportanceLevel),
  nextTriggerAt: z.number().int(),
  nextTriggerDisplay: z.string(),
  daysUntilTrigger: z.number().int(),
  icon: z.string(),
  color: z.string(),
  notificationChannels: z.array(z.enum(NotificationChannel)),
  groupId: brandedId<ReminderGroupId>().nullable().optional(),
});

export type ReminderTodayScheduleItem = z.infer<typeof ReminderTodayScheduleItemSchema>;

export const GetReminderTodayScheduleSchema = z.object({
  limit: z.number().int().min(1).max(200).optional(),
  includeExpired: z.boolean().optional(),
});

export type GetReminderTodayScheduleReq = z.infer<typeof GetReminderTodayScheduleSchema>;

export interface GetReminderTodayScheduleRes {
  data: ReminderTodayScheduleItem[];
  total: number;
}

export interface ReminderTemplateListRes {
  templates: ReminderTemplateClientDTO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
