/**
 * Reminder Operation API Requests
 * 提醒操作 API 请求定义
 */

import { z } from 'zod';
import { ImportanceLevel } from '../../../../shared/importance';
import type { ReminderType } from '../../value-objects/reminder-type';
import type { ReminderStatus } from '../../value-objects/reminder-status';

// ============ Zod Schemas ============

export const GetUpcomingRemindersRequestSchema = z.object({
  days: z.number().int().min(1).max(365).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  importanceLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  type: z.enum(['ONE_TIME', 'RECURRING']).optional(),
});

// ============ Response Types ============

/**
 * 启用/暂停操作响应
 */
export interface ReminderOperationResponseDTO {
  ok: boolean;
  message?: string;
  affectedCount?: number;
}

/**
 * 触发操作响应
 */
export interface ReminderTriggerResponseDTO {
  ok: boolean;
  triggeredAt: number;
  nextTriggerAt?: number | null;
  message?: string;
}

/**
 * 批量操作响应
 */
export interface BatchOperationResponseDTO {
  successCount: number;
  failedCount: number;
  errors?: Array<{
    uuid: string;
    error: string;
  }>;
}

// ============ Schedule Types ============

/**
 * 模板调度状态 DTO
 */
export interface TemplateScheduleStatusDTO {
  templateUuid: string;
  hasSchedule: boolean;
  enabled: boolean;
  status: ReminderStatus;
  nextTriggerAt: number | null;
  lastTriggeredAt: number | null;
  triggerCount: number;
  lastTriggerResult?: 'SUCCESS' | 'FAILED' | null;
  errorMessage?: string | null;
  updatedAt: number;
}

/**
 * 即将到来的提醒项
 */
export interface UpcomingReminderItemDTO {
  templateUuid: string;
  templateTitle: string;
  templateType: ReminderType;
  importanceLevel: ImportanceLevel;
  scheduledTime: number;
  description?: string | null;
  tags?: string[];
  color?: string | null;
  icon?: string | null;
}

/**
 * 获取即将到来的提醒请求
 */
export interface GetUpcomingRemindersRequest {
  days?: number;
  limit?: number;
  importanceLevel?: ImportanceLevel;
  type?: ReminderType;
}

/**
 * 即将到来的提醒响应
 */
export interface UpcomingRemindersResponseDTO {
  reminders: UpcomingReminderItemDTO[];
  total: number;
  fromDate: number;
  toDate: number;
}
