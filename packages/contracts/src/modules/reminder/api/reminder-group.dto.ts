/**
 * Reminder Group Operations
 *
 * This file contains DTOs for managing reminder groups.
 * Reminder groups allow organizing and controlling multiple reminders together.
 */

import { z } from 'zod';
import type { ReminderGroupClientDTO } from '../aggregates/reminder-group-client';
import { ControlMode } from '../value-objects/control-mode';

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
  controlMode: z.enum(ControlMode).optional(),
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
  controlMode: z.enum(ControlMode).optional(),
  order: z.number().int().min(0).optional(),
});

export type UpdateReminderGroupReq = z.infer<typeof UpdateReminderGroupSchema>;
export type UpdateReminderGroupRes = ReminderGroupClientDTO;

/**
 * 切换分组控制模式 Schema
 */
export const SwitchGroupControlModeSchema = z.object({
  mode: z.enum(ControlMode),
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
    id: string;
    error: string;
  }>;
}

export interface ReminderGroupListRes {
  groups: ReminderGroupClientDTO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
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
  templateId: string;
  hasSchedule: boolean;
  nextExecutionTime?: number | null;
  lastExecutionTime?: number | null;
  status: string;
}
