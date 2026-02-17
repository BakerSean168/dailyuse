import { z } from 'zod';
import { brandedId } from '@/primitives';
import type { IdentityId, TaskFolderId, GoalId, KeyResultId } from '@/primitives';
import type { ImportanceLevel } from '../../../shared/value-objects/importance';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
} from '../aggregates';
import type { RecurrenceRuleDTO, TaskReminderConfigDTO } from '../value-objects';
import type { TaskTimeConfigDTO } from '../value-objects';

export const TaskTimeConfigSchema = z.custom<TaskTimeConfigDTO>();

export type TaskTimeConfigReq = z.infer<typeof TaskTimeConfigSchema>;

export const RecurrenceConfigSchema = z.custom<RecurrenceRuleDTO>();

export type RecurrenceConfigReq = z.infer<typeof RecurrenceConfigSchema>;

export const TaskReminderConfigSchema = z.custom<TaskReminderConfigDTO>();

export const CreateTaskTemplateSchema = z.object({
  identityId: brandedId<IdentityId>().optional(),
  name: z.string().min(1, '标题不能为空'),
  description: z.string().optional().nullable(),
  taskType: z.enum(['ONE_TIME', 'RECURRING']).default('RECURRING'),
  timeConfig: TaskTimeConfigSchema,
  recurrenceRule: RecurrenceConfigSchema.optional().nullable(),
  reminderConfig: TaskReminderConfigSchema.optional().nullable(),
  importance: z.custom<ImportanceLevel>(),
  folderId: brandedId<TaskFolderId>().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  color: z.string().optional().nullable(),
});

export type CreateTaskTemplateReq = z.infer<typeof CreateTaskTemplateSchema>;
export type CreateTaskTemplateRes = {
  template: TaskTemplateClientDTO;
  instanceCount: number;
};

export const UpdateTaskTemplateSchema = z.object({
  templateId: z.string().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  recurrenceRule: RecurrenceConfigSchema.optional().nullable(),
  importance: z.custom<ImportanceLevel>().optional(),
  folderId: brandedId<TaskFolderId>().optional().nullable(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional().nullable(),
});

export type UpdateTaskTemplateReq = z.infer<typeof UpdateTaskTemplateSchema>;
export type UpdateTaskTemplateRes = TaskTemplateClientDTO;

export const QueryTaskTemplatesSchema = z.object({
  identityId: brandedId<IdentityId>(),
  status: z.array(z.string()).optional(),
  folderId: brandedId<TaskFolderId>().optional(),
  goalId: brandedId<GoalId>().optional(),
  tags: z.array(z.string()).optional(),
});

export type QueryTaskTemplatesReq = z.infer<typeof QueryTaskTemplatesSchema>;
export interface QueryTaskTemplatesRes {
  templates: TaskTemplateClientDTO[];
  total: number;
}

export const GenerateInstancesSchema = z.object({
  fromDate: z.number(),
  toDate: z.number(),
});

export type GenerateInstancesReq = z.infer<typeof GenerateInstancesSchema>;
export type GenerateInstancesRes = TaskInstanceClientDTO[];

export const BindToGoalSchema = z.object({
  goalId: brandedId<GoalId>(),
  keyResultId: brandedId<KeyResultId>(),
  goalRecordValue: z.number(),
});

export type BindToGoalReq = z.infer<typeof BindToGoalSchema>;
export type BindToGoalRes = TaskTemplateClientDTO;

export type UnbindFromGoalReq = void;
export type UnbindFromGoalRes = TaskTemplateClientDTO;

export type GetTaskTemplateReq = { id: string; includeChildren?: boolean };
export type GetTaskTemplateRes = TaskTemplateClientDTO | null;
