import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type {
  IdentityId,
  TaskFolderId,
  GoalId,
  KeyResultId,
  TaskTemplateId,
} from '../../../primitives';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import type { TaskTemplateClientDTO } from '../aggregates/task-template-client';
import type { TaskInstanceClientDTO } from '../aggregates/task-instance-client';
import { TaskGoalBindingTrigger } from '../value-objects/task-goal-binding-trigger';
import { TaskType } from '../value-objects/task-type';
import type { DependencyType } from '../value-objects/dependency-type';
import type { RecurrenceRuleDTO } from '../value-objects/recurrence-rule';
import type { TaskReminderConfigDTO } from '../value-objects/task-reminder-config';
import type { TaskGoalBindingDTO } from '../value-objects/task-goal-binding';
import type { TaskTimeConfigDTO } from '../value-objects/task-time-config';

export const TaskTimeConfigSchema = z
  .custom<TaskTimeConfigDTO>()
  .openapi({ type: 'object', description: '任务时间配置' });

export type TaskTimeConfigReq = z.infer<typeof TaskTimeConfigSchema>;

export const RecurrenceConfigSchema = z
  .custom<RecurrenceRuleDTO>((value) => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as RecurrenceRuleDTO;
    return !(
      candidate.endDate !== null &&
      candidate.endDate !== undefined &&
      candidate.occurrences !== null &&
      candidate.occurrences !== undefined
    );
  }, '重复规则不能同时设置结束日期和重复次数')
  .openapi({ type: 'object', description: '循环规则配置' });

export type RecurrenceConfigReq = z.infer<typeof RecurrenceConfigSchema>;

export const TaskReminderConfigSchema = z
  .custom<TaskReminderConfigDTO>()
  .openapi({ type: 'object', description: '任务提醒配置' });

export const TaskGoalBindingSchema = z.object({
  goalId: brandedId<GoalId>(),
  keyResultId: brandedId<KeyResultId>(),
  goalRecordValue: z.number().nonnegative(),
  progressTrigger: z.enum(TaskGoalBindingTrigger).default(TaskGoalBindingTrigger.PerInstance),
});

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
});

export type CreateTaskTemplateReq = z.infer<typeof CreateTaskTemplateSchema>;

// Internal input type (used by controller -> use case) with identityId
export interface CreateTaskTemplateInput extends CreateTaskTemplateReq {
  identityId: IdentityId;
}
export type CreateTaskTemplateRes = {
  template: TaskTemplateClientDTO;
  instanceCount: number;
};

export const UpdateTaskTemplateSchema = z.object({
  templateId: z.string().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  timeConfig: TaskTimeConfigSchema.optional().nullable(),
  recurrenceRule: RecurrenceConfigSchema.optional().nullable(),
  reminderConfig: TaskReminderConfigSchema.optional().nullable(),
  importance: z
    .custom<ImportanceLevel>()
    .openapi({
      type: 'string',
      enum: ['low', 'medium', 'high', 'critical'],
      description: '重要程度',
    })
    .optional(),
  parentTaskId: brandedId<TaskTemplateId>().optional().nullable(),
  folderId: brandedId<TaskFolderId>().optional().nullable(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional().nullable(),
  goalBinding: TaskGoalBindingSchema.optional().nullable(),
});

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

export interface TaskGraphDependencyDTO {
  id: string;
  predecessorTaskId: string;
  successorTaskId: string;
  dependencyType: DependencyType;
  lagDays?: number;
  createdAt: number;
  updatedAt: number;
}

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

export const BindToGoalSchema = z.object({
  goalId: brandedId<GoalId>(),
  keyResultId: brandedId<KeyResultId>(),
  goalRecordValue: z.number().nonnegative(),
  progressTrigger: z.enum(TaskGoalBindingTrigger).default(TaskGoalBindingTrigger.PerInstance),
});

export type BindToGoalReq = z.infer<typeof BindToGoalSchema>;
export type BindToGoalRes = TaskTemplateClientDTO;

export type UnbindFromGoalReq = void;
export type UnbindFromGoalRes = TaskTemplateClientDTO;

export type GetTaskTemplateReq = { id: string; includeChildren?: boolean };
export type GetTaskTemplateRes = TaskTemplateClientDTO | null;
