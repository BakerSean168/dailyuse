/**
 * Task Rescheduling and Completion Operations
 * 
 * This file contains DTOs for rescheduling task instances and toggling completion status.
 * These operations modify specific task instances without affecting the template.
 */

import { z } from 'zod';
import { brandedId } from '@/primitives';
import type { TaskInstanceId } from '@/primitives';
import { TaskTimeConfigSchema } from './task-crud.dto';
import type { TaskInstanceClientDTO } from '../aggregates';

// ============================================================================
// RESCHEDULE Task Operations
// ============================================================================

/**
 * 重新调度任务 Schema
 */
export const RescheduleTaskSchema = z.object({
  instanceId: brandedId<TaskInstanceId>(),
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
  instanceId: brandedId<TaskInstanceId>(),
  note: z.string().optional(),
});

export type ToggleTaskCompletionReq = z.infer<typeof ToggleTaskCompletionSchema>;
export type ToggleTaskCompletionRes = TaskInstanceClientDTO;
