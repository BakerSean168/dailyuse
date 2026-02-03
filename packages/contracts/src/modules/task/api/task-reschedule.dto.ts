/**
 * Task Rescheduling and Completion Operations
 * 
 * This file contains DTOs for rescheduling task instances and toggling completion status.
 * These operations modify specific task instances without affecting the template.
 */

import { z } from 'zod';
import { TaskTimeConfigSchema } from './task-crud.dto';
import type { TaskInstanceClientDTO } from '../aggregates';

// ============================================================================
// RESCHEDULE Task Operations
// ============================================================================

/**
 * 重新调度任务 Schema
 */
export const RescheduleTaskSchema = z.object({
  instanceId: z.string().uuid(),
  newTime: TaskTimeConfigSchema,
});

export type RescheduleTaskReq = z.infer<typeof RescheduleTaskSchema>;
export type RescheduleTaskRes = TaskInstanceClientDTO;

// ============================================================================
// TASK Completion Operations
// ============================================================================

/**
 * 切换任务完成状态 Schema
 */
export const ToggleTaskCompletionSchema = z.object({
  instanceId: z.string().uuid(),
  note: z.string().optional(),
});

export type ToggleTaskCompletionReq = z.infer<typeof ToggleTaskCompletionSchema>;
export type ToggleTaskCompletionRes = TaskInstanceClientDTO;
