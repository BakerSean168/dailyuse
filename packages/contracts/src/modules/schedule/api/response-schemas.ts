/**
 * Schedule - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { ScheduleTaskId, ScheduleId, ScheduleExecutionId, IdentityId } from '../../../primitives';
import { ScheduleTaskStatus } from '../value-objects/schedule-task-status';
import { SourceModule } from '../value-objects/source-module';
import { ExecutionStatus } from '../value-objects/execution-status';
import { TaskPriority } from '../value-objects/task-priority';
import { Timezone } from '../value-objects/timezone';
import {
  ConflictDetectionResultSchema,
  ConflictDetailSchema,
  ConflictSuggestionSchema,
} from '../value-objects/conflict-detection-result';

// Residual 725: conflict detection schemas owned by conflict-detection-result.ts
// (re-exported for OpenAPI route consumers).
export {
  ConflictDetectionResultSchema,
  ConflictDetailSchema,
  ConflictSuggestionSchema,
};

// ============ Inline Value Object Schemas ============

const ScheduleConfigSchema = z.object({
  cronExpression: z.string().nullable(),
  timezone: z.enum(Timezone),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  maxExecutions: z.number().nullable(),
});

const ExecutionInfoSchema = z.object({
  nextRunAt: z.string().nullable(),
  lastRunAt: z.string().nullable(),
  executionCount: z.number(),
  lastExecutionStatus: z.enum(ExecutionStatus).nullable(),
  lastExecutionDuration: z.number().nullable(),
  consecutiveFailures: z.number(),
});

const RetryPolicySchema = z.object({
  enabled: z.boolean(),
  maxRetries: z.number(),
  retryDelay: z.number(),
  backoffMultiplier: z.number(),
  maxRetryDelay: z.number(),
});

const TaskMetadataSchema = z.object({
  payload: z.record(z.string(), z.unknown()),
  tags: z.array(z.string()),
  priority: z.enum(TaskPriority),
  timeout: z.number().nullable(),
});

const ScheduleExecutionResponseSchema: z.ZodType<{
  id: ScheduleExecutionId;
  scheduleTaskId: ScheduleTaskId;
  executionTime: number;
  status: ExecutionStatus;
  duration: number | null;
  result: Record<string, unknown> | null;
  error: string | null;
  retryCount: number;
  version: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}> = z.object({
  id: brandedId<ScheduleExecutionId>(),
  scheduleTaskId: brandedId<ScheduleTaskId>(),
  executionTime: z.number(),
  status: z.enum(ExecutionStatus),
  duration: z.number().nullable(),
  result: z.record(z.string(), z.unknown()).nullable(),
  error: z.string().nullable(),
  retryCount: z.number(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
});

// ============ Response Schemas ============

/**
 * ScheduleTask Response Schema
 */
export const ScheduleTaskResponseSchema = z.object({
  id: brandedId<ScheduleTaskId>(),
  identityId: brandedId<IdentityId>(),
  name: z.string(),
  description: z.string().nullable(),
  sourceModule: z.enum(SourceModule),
  sourceEntityId: z.string(),
  status: z.enum(ScheduleTaskStatus),
  enabled: z.boolean(),
  schedule: ScheduleConfigSchema,
  execution: ExecutionInfoSchema,
  retryPolicy: RetryPolicySchema,
  metadata: TaskMetadataSchema,
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  executions: z.array(ScheduleExecutionResponseSchema).nullable(),
});

/**
 * CalendarEntry (Schedule Event) Response Schema
 */
export const CalendarEntryResponseSchema = z.object({
  id: brandedId<ScheduleId>(),
  identityId: brandedId<IdentityId>(),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.number(),
  endTime: z.number(),
  duration: z.number(),
  hasConflict: z.boolean(),
  conflictingEntries: z.array(z.string()).optional(),
  priority: z.number().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/**
 * Schedule BatchOperation Response Schema
 */
/** Residual 639: schedule batch result schema (renamed off shared dual name). */
// Residual 717: ScheduleBatchOperationResponseSchema is the sole batch response shape
// (ScheduleBatchOperationResponseDTO is a z.infer alias).
export const ScheduleBatchOperationResponseSchema = z.object({
  success: z.array(z.string()),
  failed: z.array(z.object({ taskId: brandedId<ScheduleTaskId>(), error: z.string() })),
  total: z.number(),
  successCount: z.number(),
  failedCount: z.number(),
});

// ============ Conflict Detection Response Schemas ============
// Residual 663: detect-conflicts OpenAPI body is ConflictDetectionResult (no wrapper dual).
// Residual 679: drop DetectConflictsResponseSchema name dual; routes use ConflictDetectionResultSchema only.
// Residual 725: ConflictDetectionResultSchema owned by value-objects/conflict-detection-result.ts.

/**
 * CreateSchedule (with conflict detection) Response Schema
 */
// Residual 715: CreateSchedule / ResolveConflict OpenAPI schemas are the sole response shapes
// (CreateScheduleResponseDTO / ResolveConflictResponseDTO / AppliedResolution are z.infer aliases).
export const CreateScheduleResponseSchema = z.object({
  schedule: CalendarEntryResponseSchema,
  conflicts: ConflictDetectionResultSchema.optional(),
});

export const AppliedResolutionSchema = z.object({
  strategy: z.string(),
  previousStartTime: z.number().optional(),
  previousEndTime: z.number().optional(),
  changes: z.array(z.string()),
});

/**
 * ResolveConflict Response Schema
 */
export const ResolveConflictResponseSchema = z.object({
  schedule: CalendarEntryResponseSchema,
  conflicts: ConflictDetectionResultSchema,
  applied: AppliedResolutionSchema,
});

// Residual 665: batch-delete OpenAPI body reuses schedule batch operation schema (no dual).
