/** Portable Task vNext DTOs — schemaVersion 2. */
import { z } from 'zod';
import { PortableRefSchema, IsoDateString } from './portable-common.dto';
import { TaskGoalBindingTrigger } from '../../task/value-objects/task-goal-binding-trigger';

export const PortableTaskTemplateSchema = z.object({
  _ref: PortableRefSchema,
  title: z.string(),
  description: z.string().nullable().optional(),
  taskType: z.string(),
  importance: z.string(),
  tags: z.array(z.string()),
  color: z.string().nullable().optional(),
  status: z.string(),
  outcome: z.string(),
  completionPolicy: z.string(),
  closedAt: IsoDateString.nullable().optional(),
  archivedAt: IsoDateString.nullable().optional(),
  abandonedReason: z.string().nullable().optional(),
  goalRef: PortableRefSchema.nullable().optional(),
  keyResultRef: PortableRefSchema.nullable().optional(),
  goalRecordValue: z.number().nullable().optional(),
  goalProgressTrigger: z.enum(TaskGoalBindingTrigger).nullable().optional(),
  checklist: z.array(z.unknown()),
  timeConfig: z.unknown(),
  recurrenceRule: z.unknown().nullable().optional(),
  reminderConfig: z.unknown().nullable().optional(),
  lastGeneratedDate: IsoDateString.nullable().optional(),
  generateAheadDays: z.number().int().nullable().optional(),
  createdAt: IsoDateString.optional(),
  updatedAt: IsoDateString.optional(),
}).strict().superRefine((task, ctx) => {
  const hasGoalRef = task.goalRef != null;
  const hasKeyResultRef = task.keyResultRef != null;
  if (hasGoalRef !== hasKeyResultRef) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Task goal binding requires both goalRef and keyResultRef' });
  }
  if (!hasGoalRef && (task.goalRecordValue != null || task.goalProgressTrigger != null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Task contribution fields require a goal binding' });
  }
});
export type PortableTaskTemplate = z.infer<typeof PortableTaskTemplateSchema>;

export const PortableTaskInstanceSchema = z.object({
  _ref: PortableRefSchema,
  templateRef: PortableRefSchema,
  instanceDate: IsoDateString,
  occurrenceKey: z.string().nullable().optional(),
  timeConfig: z.unknown(),
  importance: z.string(),
  status: z.string(),
  actualStartTime: IsoDateString.nullable().optional(),
  actualEndTime: IsoDateString.nullable().optional(),
  note: z.string().nullable().optional(),
  createdAt: IsoDateString.optional(),
  updatedAt: IsoDateString.optional(),
}).strict();
export type PortableTaskInstance = z.infer<typeof PortableTaskInstanceSchema>;

export const PortableTaskDataSchema = z.object({
  templates: z.array(PortableTaskTemplateSchema),
  instances: z.array(PortableTaskInstanceSchema),
}).strict();
export type PortableTaskData = z.infer<typeof PortableTaskDataSchema>;
