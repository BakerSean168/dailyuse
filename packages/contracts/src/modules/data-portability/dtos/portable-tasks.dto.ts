/**
 * Portable Tasks DTOs
 */

import { z } from 'zod';
import { PortableRefSchema, IsoDateString } from './portable-common.dto';

export const PortableTaskFolderSchema = z
  .object({
    _ref: PortableRefSchema,
    name: z.string(),
    color: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    order: z.number(),
  })
  .strict();

export type PortableTaskFolder = z.infer<typeof PortableTaskFolderSchema>;

export const PortableTaskTemplateSchema = z
  .object({
    _ref: PortableRefSchema,
    title: z.string(),
    description: z.string().nullable().optional(),
    taskType: z.string(),
    importance: z.string(),
    tags: z.array(z.string()),
    color: z.string().nullable().optional(),
    status: z.string(),
    folderRef: PortableRefSchema.nullable().optional(),
    goalRef: PortableRefSchema.nullable().optional(),
    keyResultRef: PortableRefSchema.nullable().optional(),
    goalBinding: z.unknown().optional(),
    checklist: z.array(z.unknown()),
    parentTaskRef: PortableRefSchema.nullable().optional(),
    timeConfig: z.unknown().optional(),
    recurrenceRule: z.unknown().optional(),
    reminderConfig: z.unknown().optional(),
    startDate: IsoDateString.nullable().optional(),
    dueDate: IsoDateString.nullable().optional(),
    completedAt: IsoDateString.nullable().optional(),
    estimatedMinutes: z.number().nullable().optional(),
    actualMinutes: z.number().nullable().optional(),
    note: z.string().nullable().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export type PortableTaskTemplate = z.infer<typeof PortableTaskTemplateSchema>;

export const PortableTaskInstanceSchema = z
  .object({
    _ref: PortableRefSchema,
    templateRef: PortableRefSchema,
    instanceDate: z.number(),
    timeConfig: z.unknown().optional(),
    importance: z.string(),
    priority: z.number().optional(),
    status: z.string(),
    completionRecord: z.unknown().optional(),
    skipRecord: z.unknown().optional(),
    actualStartTime: z.number().nullable().optional(),
    actualEndTime: z.number().nullable().optional(),
    note: z.string().nullable().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export type PortableTaskInstance = z.infer<typeof PortableTaskInstanceSchema>;

export const PortableTaskDependencySchema = z
  .object({
    _ref: PortableRefSchema,
    predecessorTaskRef: PortableRefSchema,
    successorTaskRef: PortableRefSchema,
    dependencyType: z.string(),
    lagDays: z.number().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export type PortableTaskDependency = z.infer<typeof PortableTaskDependencySchema>;

export const PortableTaskDataSchema = z
  .object({
    folders: z.array(PortableTaskFolderSchema),
    templates: z.array(PortableTaskTemplateSchema),
    instances: z.array(PortableTaskInstanceSchema),
    dependencies: z.array(PortableTaskDependencySchema),
  })
  .strict();

export type PortableTaskData = z.infer<typeof PortableTaskDataSchema>;
