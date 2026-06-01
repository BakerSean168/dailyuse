import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type {
  IdentityId,
  TaskFolderId,
  GoalId,
  KeyResultId,
  TaskTemplateId,
  TaskDependencyId,
} from '../../../primitives';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import type { TaskTemplateClientDTO } from '../aggregates/task-template-client';
import type { TaskInstanceClientDTO } from '../aggregates/task-instance-client';
import { DayOfWeek } from '../value-objects/day-of-week';
import { RecurrenceFrequency } from '../value-objects/recurrence-frequency';
import { ReminderTimeUnit } from '../value-objects/reminder-time-unit';
import { TaskReminderType } from '../value-objects/task-reminder-type';
import { TaskGoalBindingTrigger } from '../value-objects/task-goal-binding-trigger';
import { TaskTimeType } from '../value-objects/task-time-type';
import { TaskType } from '../value-objects/task-type';
import type { DependencyType } from '../value-objects/dependency-type';
import type { RecurrenceRuleDTO } from '../value-objects/recurrence-rule';
import type { TaskReminderConfigDTO } from '../value-objects/task-reminder-config';
import type { TaskTimeConfigDTO } from '../value-objects/task-time-config';

const DayOfWeekSchema = z.union([
  z.literal(DayOfWeek.Sunday),
  z.literal(DayOfWeek.Monday),
  z.literal(DayOfWeek.Tuesday),
  z.literal(DayOfWeek.Wednesday),
  z.literal(DayOfWeek.Thursday),
  z.literal(DayOfWeek.Friday),
  z.literal(DayOfWeek.Saturday),
]);

export const TaskTimeConfigSchema: z.ZodType<TaskTimeConfigDTO> = z
  .object({
    timeType: z.enum([TaskTimeType.AllDay, TaskTimeType.TimePoint, TaskTimeType.TimeRange]),
    startDate: z.number().int().nullable(),
    timePoint: z.number().int().nullable(),
    timeRange: z
      .object({
        start: z.number().int(),
        end: z.number().int(),
      })
      .nullable()
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.timeType === TaskTimeType.TimePoint && value.timePoint == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['timePoint'],
        message: '时间点任务必须提供 timePoint',
      });
    }

    if (value.timeType === TaskTimeType.TimeRange) {
      if (!value.timeRange) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['timeRange'],
          message: '时间段任务必须提供 timeRange',
        });
      } else if (value.timeRange.start >= value.timeRange.end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['timeRange'],
          message: 'timeRange.start 必须小于 timeRange.end',
        });
      }
    }
  })
  .openapi({ type: 'object', description: '任务时间配置' });

export type TaskTimeConfigReq = z.infer<typeof TaskTimeConfigSchema>;

export const RecurrenceConfigSchema: z.ZodType<RecurrenceRuleDTO> = z
  .object({
    frequency: z.enum([
      RecurrenceFrequency.Daily,
      RecurrenceFrequency.Weekly,
      RecurrenceFrequency.Monthly,
      RecurrenceFrequency.Yearly,
    ]),
    interval: z.number().int().positive(),
    daysOfWeek: z.array(DayOfWeekSchema),
    endDate: z.number().int().nullable(),
    occurrences: z.number().int().positive().nullable(),
  })
  .superRefine((candidate, ctx) => {
    if (candidate.endDate != null && candidate.occurrences != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '重复规则不能同时设置结束日期和重复次数',
      });
    }
  })
  .openapi({ type: 'object', description: '循环规则配置' });

export type RecurrenceConfigReq = z.infer<typeof RecurrenceConfigSchema>;

export const TaskReminderConfigSchema: z.ZodType<TaskReminderConfigDTO> = z
  .object({
    enabled: z.boolean(),
    triggers: z.array(
      z
        .object({
          type: z.enum([TaskReminderType.Absolute, TaskReminderType.Relative]),
          absoluteTime: z.number().int().nullable(),
          relativeValue: z.number().int().nullable(),
          relativeUnit: z
            .enum([ReminderTimeUnit.Minutes, ReminderTimeUnit.Hours, ReminderTimeUnit.Days])
            .nullable(),
        })
        .superRefine((trigger, ctx) => {
          if (trigger.type === TaskReminderType.Absolute && trigger.absoluteTime == null) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['absoluteTime'],
              message: '绝对时间提醒必须提供 absoluteTime',
            });
          }

          if (trigger.type === TaskReminderType.Relative) {
            if (trigger.relativeValue == null) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['relativeValue'],
                message: '相对时间提醒必须提供 relativeValue',
              });
            }

            if (trigger.relativeUnit == null) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['relativeUnit'],
                message: '相对时间提醒必须提供 relativeUnit',
              });
            }
          }
        }),
    ),
  })
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
  templateId: brandedId<TaskTemplateId>().optional(),
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

export interface TaskGraphDependencyDTO {
  id: TaskDependencyId;
  predecessorTaskId: TaskTemplateId;
  successorTaskId: TaskTemplateId;
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

export type GetTaskTemplateReq = { id: TaskTemplateId; includeChildren?: boolean };
export type GetTaskTemplateRes = TaskTemplateClientDTO | null;
