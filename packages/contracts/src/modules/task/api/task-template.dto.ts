import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type {
  IdentityId,
  TaskFolderId,
  GoalId,
  TaskTemplateId,
} from '../../../primitives';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import type { TaskTemplateClientDTO } from '../aggregates/task-template-client';
import type { TaskInstanceClientDTO } from '../aggregates/task-instance-client';
import { TaskType } from '../value-objects/task-type';
import type { TaskGraphDependencyDTO } from './task-dependency.dto';
import {
  TaskReminderConfigSchema,
} from '../value-objects/task-reminder-config';
import {
  TaskGoalBindingSchema,
} from '../value-objects/task-goal-binding';
import {
  RecurrenceConfigSchema,
} from '../value-objects/recurrence-rule';
import {
  TaskTimeConfigSchema,
} from '../value-objects/task-time-config';

// Residual 739: TaskReminderConfigSchema / TaskGoalBindingSchema owned by value-objects
// (semantic DTOs are z.infer aliases). Re-export for OpenAPI/route consumers.
export { TaskReminderConfigSchema, TaskGoalBindingSchema };

// Residual 743: RecurrenceConfigSchema owned by value-objects
// (semantic RecurrenceRuleDTO / RecurrenceConfigReq are z.infer aliases).
export { RecurrenceConfigSchema };
export type { RecurrenceConfigReq } from '../value-objects/recurrence-rule';

// Residual 747: TaskTimeConfigSchema owned by value-objects
// (semantic TaskTimeConfigDTO / TaskTimeConfigReq are z.infer aliases).
// Domain TaskTimeConfig startDate is Instant (ADR-037; intentional dual interface names).
export { TaskTimeConfigSchema };
export type { TaskTimeConfigReq } from '../value-objects/task-time-config';


// Public transport schema - NO identityId (injected from Context)
export const CreateTaskTemplateSchema = z.object({
  name: z.string().min(1, '标题不能为空'),
  description: z.string().optional().nullable(),
  taskType: z.enum([TaskType.OneTime, TaskType.Recurring]).default(TaskType.Recurring),
  timeConfig: TaskTimeConfigSchema,
  recurrenceRule: RecurrenceConfigSchema.optional().nullable(),
  reminderConfig: TaskReminderConfigSchema.optional().nullable(),
  importance: z.enum(ImportanceLevel),
  parentTaskId: brandedId<TaskTemplateId>().optional().nullable(),
  folderId: brandedId<TaskFolderId>().optional().nullable(),
  tags: z.array(z.string()).default([]).optional(),
  color: z.string().optional().nullable(),
  goalBinding: TaskGoalBindingSchema.optional().nullable(),
}).strict();

export type CreateTaskTemplateReq = z.infer<typeof CreateTaskTemplateSchema>;

// Internal input type (used by controller -> use case) with identityId
export interface CreateTaskTemplateInput extends CreateTaskTemplateReq {
  identityId: IdentityId;
}
export type CreateTaskTemplateRes = {
  template: TaskTemplateClientDTO;
  instanceCount: number;
  todayInstanceCreated: boolean;
};

export const UpdateTaskTemplateSchema = z.object({
  templateId: brandedId<TaskTemplateId>().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  timeConfig: TaskTimeConfigSchema.optional().nullable(),
  recurrenceRule: RecurrenceConfigSchema.optional().nullable(),
  reminderConfig: TaskReminderConfigSchema.optional().nullable(),
  importance: z.enum(ImportanceLevel).optional(),
  parentTaskId: brandedId<TaskTemplateId>().optional().nullable(),
  folderId: brandedId<TaskFolderId>().optional().nullable(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional().nullable(),
  goalBinding: TaskGoalBindingSchema.optional().nullable(),
}).strict();

export type UpdateTaskTemplateReq = z.infer<typeof UpdateTaskTemplateSchema>;
export type UpdateTaskTemplateRes = TaskTemplateClientDTO;

// Public transport schema - NO identityId (injected from Context)
export const ListTaskTemplateFiltersSchema = z.object({
  status: z.array(z.string()).optional(),
  folderId: brandedId<TaskFolderId>().optional(),
  goalId: brandedId<GoalId>().optional(),
  tags: z.array(z.string()).optional(),
});

export type ListTaskTemplateFilters = z.infer<typeof ListTaskTemplateFiltersSchema>;

export const TaskTemplateInstancesQuerySchema = z.object({
  from: z.coerce.number().int().optional(),
  to: z.coerce.number().int().optional(),
});

export type TaskTemplateInstancesQuery = z.infer<typeof TaskTemplateInstancesQuerySchema>;

// Internal query type (used by controller -> use case) with identityId
export interface QueryTaskTemplatesInternal {
  identityId: IdentityId;
  status?: string[];
  folderId?: TaskFolderId;
  goalId?: GoalId;
  tags?: string[];
}
export interface QueryTaskTemplatesRes {
  templates: TaskTemplateClientDTO[];
  total: number;
}

// Residual 797: TaskGraphDependencyDTO dual retired — sole TaskDependencyResponseSchema
// (semantic type is z.infer alias owned via task-dependency.dto; re-exported for graph consumers).
export type { TaskGraphDependencyDTO };

export interface QueryTaskTemplateGraphRes {
  templates: TaskTemplateClientDTO[];
  dependencies: TaskGraphDependencyDTO[];
  total: number;
}

export const GenerateInstancesSchema = z.object({
  fromDate: z.number(),
  toDate: z.number(),
});

export type GenerateInstancesReq = z.infer<typeof GenerateInstancesSchema>;
export type GenerateInstancesRes = TaskInstanceClientDTO[];

// Residual 667: bind-to-goal request reuses TaskGoalBindingSchema (no dual body).
export type BindToGoalReq = z.infer<typeof TaskGoalBindingSchema>;
export type BindToGoalRes = TaskTemplateClientDTO;

export type UnbindFromGoalReq = void;
export type UnbindFromGoalRes = TaskTemplateClientDTO;

export type GetTaskTemplateReq = { id: TaskTemplateId; includeChildren?: boolean };
export type GetTaskTemplateRes = TaskTemplateClientDTO | null;
