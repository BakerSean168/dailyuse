import { z } from 'zod';
import { brandedId } from '@/primitives';
import type { TaskInstanceId } from '@/primitives';
import { TaskTimeConfigSchema } from './task-template.dto';
import type { TaskInstanceClientDTO } from '../aggregates';

export const RescheduleTaskSchema = z.object({
  instanceId: brandedId<TaskInstanceId>(),
  newTime: TaskTimeConfigSchema,
});

export type RescheduleTaskReq = z.infer<typeof RescheduleTaskSchema>;
export type RescheduleTaskRes = TaskInstanceClientDTO;

export const ToggleTaskCompletionSchema = z.object({
  instanceId: brandedId<TaskInstanceId>(),
  note: z.string().optional(),
});

export type ToggleTaskCompletionReq = z.infer<typeof ToggleTaskCompletionSchema>;
export type ToggleTaskCompletionRes = TaskInstanceClientDTO;
