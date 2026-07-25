/**
 * Task - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 * These schemas must match what controllers actually return (the ClientDTO interfaces).
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { TaskTemplateId, TaskInstanceId, TaskDependencyId, IdentityId, TaskFolderId, SubtaskId } from '../../../primitives';
import {
  TaskGoalBindingSchema,
  TaskReminderConfigSchema,
  TaskTimeConfigSchema,
  RecurrenceConfigSchema,
} from './task-template.dto';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import { DependencyType } from '../value-objects/dependency-type';
import { TaskInstanceStatus } from '../value-objects/task-instance-status';
import { TaskTemplateStatus } from '../value-objects/task-template-status';

// ============ TaskTemplate Response Schema ============

export const TaskTemplateResponseSchema = z.object({
  id: brandedId<TaskTemplateId>(),
  identityId: brandedId<IdentityId>(),
  name: z.string(),
  description: z.string().nullable(),
  timeConfig: TaskTimeConfigSchema,
  recurrenceRule: RecurrenceConfigSchema.nullable(),
  reminderConfig: TaskReminderConfigSchema.nullable(),
  importance: z.enum(ImportanceLevel),
  priority: z.number().optional(),
  goalBinding: TaskGoalBindingSchema.nullable(),
  folderId: brandedId<TaskFolderId>().nullable(),
  tags: z.array(z.string()),
  color: z.string().nullable(),
  status: z.enum(TaskTemplateStatus),
  lastGeneratedDate: z.number().nullable(),
  generateAheadDays: z.number().nullable(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  parentTaskId: brandedId<TaskTemplateId>().nullable(),
  startDate: z.number().nullable(),
  dueDate: z.number().nullable(),
  completedAt: z.number().nullable(),
  estimatedMinutes: z.number().nullable(),
  actualMinutes: z.number().nullable(),
  comment: z.string().nullable(),
  dependencyStatus: z.string().optional(),
  isBlocked: z.boolean().optional(),
  blockingReason: z.string().nullable(),
  instanceCount: z.number(),
  completedInstanceCount: z.number(),
  pendingInstanceCount: z.number(),
  completionRate: z.number(),
});

export const CreateTaskTemplateResponseSchema = z.object({
  template: TaskTemplateResponseSchema,
  instanceCount: z.number().int().nonnegative(),
  todayInstanceCreated: z.boolean(),
});

export const TaskTemplateListResponseSchema = z.object({
  templates: z.array(TaskTemplateResponseSchema),
  total: z.number(),
});

// ============ TaskDependency Response Schema ============
// Residual 797: TaskGraphDependencyDTO dual retired — this schema is the sole graph-edge shape
// (semantic TaskGraphDependencyDTO is z.infer alias).

// Residual 831: TaskDependencyClientDTO dual retired — sole TaskDependencyResponseSchema + z.infer
// (semantic type is z.infer alias in aggregates/task-dependency-client.ts).
export const TaskDependencyResponseSchema = z.object({
  id: brandedId<TaskDependencyId>(),
  predecessorTaskId: brandedId<TaskTemplateId>(),
  successorTaskId: brandedId<TaskTemplateId>(),
  dependencyType: z.enum(DependencyType),
  lagDays: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  predecessorTaskTitle: z.string().optional(),
  successorTaskTitle: z.string().optional(),
});

export const DependencyChainResponseSchema = z.object({
  taskId: brandedId<TaskTemplateId>(),
  allPredecessors: z.array(brandedId<TaskTemplateId>()),
  allSuccessors: z.array(brandedId<TaskTemplateId>()),
  depth: z.number(),
  isOnCriticalPath: z.boolean(),
});

// Residual 711: ValidateDependencyResponseSchema is the sole validate-dependency response shape
// (ValidateDependencyResponse is a z.infer alias).
export const ValidateDependencyResponseSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
  wouldCreateCycle: z.boolean().optional(),
  cyclePath: z.array(brandedId<TaskTemplateId>()).optional(),
  message: z.string().optional(),
});

export const TaskTemplateGraphResponseSchema = z.object({
  templates: z.array(TaskTemplateResponseSchema),
  dependencies: z.array(TaskDependencyResponseSchema),
  total: z.number(),
});

// ============ TaskInstance Response Schema ============

// Residual 831: TaskInstanceClientDTO dual retired — sole TaskInstanceResponseSchema + z.infer
// (semantic type is z.infer alias in aggregates/task-instance-client.ts).
export const TaskInstanceResponseSchema = z.object({
  id: brandedId<TaskInstanceId>(),
  templateId: brandedId<TaskTemplateId>(),
  identityId: brandedId<IdentityId>(),
  instanceDate: z.number(),
  timeConfig: TaskTimeConfigSchema,
  importance: z.enum(ImportanceLevel).optional(),
  priority: z.number().optional(),
  status: z.enum(TaskInstanceStatus),
  actualStartTime: z.number().nullable(),
  actualEndTime: z.number().nullable(),
  comment: z.string().nullable(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
});

// Residual 697: CheckExpiredTaskInstancesResponseSchema is the sole expired-list response shape
// (CheckExpiredTaskInstancesRes is a z.infer alias).
export const CheckExpiredTaskInstancesResponseSchema = z.object({
  count: z.number(),
  instances: z.array(TaskInstanceResponseSchema),
});


// Residual 837: TaskFolderClientDTO dual retired — sole TaskFolderResponseSchema + z.infer
// (semantic type is z.infer alias in aggregates/task-folder-client.ts).
// Residual 843: TaskFolderServerDTO also z.infer of this schema (client+server single-track).
export const TaskFolderResponseSchema = z.object({
  id: brandedId<TaskFolderId>(),
  identityId: brandedId<IdentityId>(),
  name: z.string(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  order: z.number(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
});

// Residual 837: TaskTemplateHistoryClientDTO dual retired — sole TaskTemplateHistoryResponseSchema + z.infer
// (semantic type is z.infer alias in entities/task-template-history-client.ts).
// Residual 843: TaskTemplateHistoryServerDTO also z.infer of this schema (client+server single-track).
export const TaskTemplateHistoryResponseSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  action: z.string(),
  changes: z.unknown(),
  createdAt: z.number(),
});


// Residual 841: SubtaskClientDTO dual retired — sole SubtaskResponseSchema + z.infer
// (semantic type is z.infer alias in entities/subtask-client.ts).
export const SubtaskResponseSchema = z.object({
  id: brandedId<SubtaskId>(),
  name: z.string(),
  isCompleted: z.boolean(),
  order: z.number(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
});
