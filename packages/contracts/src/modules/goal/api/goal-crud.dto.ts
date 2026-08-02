/**
 * Goal - CRUD Operations
 *
 * 目标的基础增删改查操作，包括批量操作
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { GoalId, IdentityId, GoalFolderId, KeyResultId } from '../../../primitives';
import type { GoalClientDTO } from '../aggregates/goal-client';
import { GoalStatus } from '../value-objects/goal-status';
import { GoalSystemView } from '../value-objects/goal-system-view';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import {
  GoalReminderConfigDTOSchema,
  ReminderTriggerSchema,
} from '../value-objects/goal-reminder-config';
import { KeyResultInputSchema } from './key-result-input.schema';

const GoalNameSchema = z
  .string()
  .trim()
  .min(1, '目标名称不能为空')
  .max(256, '目标名称不能超过 256 字符');

// Residual 753: request reminder-config reuses residual 741 VO schemas.
// Request-only refinements (value.min(0), triggers.max(10)) without dual bodies.
const GoalReminderConfigRequestSchema = GoalReminderConfigDTOSchema.extend({
  triggers: z.array(ReminderTriggerSchema.extend({ value: z.number().min(0) })).max(10),
});

/** Residual 677: shared goalId params for goal-scoped list queries. */
export const GoalIdParamsSchema = z.object({
  goalId: brandedId<GoalId>(),
});

// ============================================================================
// CREATE Goal
// ============================================================================

/**
 * 创建目标 Schema
 */
export const CreateGoalSchema = z
  .object({
    name: GoalNameSchema,
    description: z.string().max(2000, '描述不能超过 2000 字符').optional(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, '颜色必须是有效的 hex 格式')
      .optional(),
    feasibilityAnalysis: z.string().max(2000).optional(),
    motivation: z.string().max(2000).optional(),
    importance: z.enum(ImportanceLevel),
    category: z.string().max(100).optional(),
    tags: z.array(z.string().max(50)).optional(),
    startDate: z.number().int().optional(),
    targetDate: z.number().int().optional(),
    folderId: brandedId<GoalFolderId>().optional(),
    parentGoalId: brandedId<GoalId>().optional(),
    reminderConfig: GoalReminderConfigRequestSchema.nullable().optional(),
    initialKeyResults: z.array(KeyResultInputSchema).max(50).optional(),
  })
  .strict();

export type CreateGoalReq = z.infer<typeof CreateGoalSchema>;
export type CreateGoalRes = import('./response-schemas').GoalMutationReceipt;

// ============================================================================
// UPDATE Goal
// ============================================================================

/**
 * 更新目标 Schema
 */
export const UpdateGoalSchema = z
  .object({
    expectedVersion: z.number().int().min(1),
    name: GoalNameSchema.optional(),
    description: z.string().max(2000).nullable().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i)
      .nullable()
      .optional(),
    feasibilityAnalysis: z.string().max(2000).nullable().optional(),
    motivation: z.string().max(2000).nullable().optional(),
    importance: z.enum(ImportanceLevel).optional(),
    category: z.string().max(100).nullable().optional(),
    tags: z.array(z.string().max(50)).nullable().optional(),
    startDate: z.number().int().nullable().optional(),
    targetDate: z.number().int().nullable().optional(),
    folderId: brandedId<GoalFolderId>().nullable().optional(),
    parentGoalId: brandedId<GoalId>().nullable().optional(),
    reminderConfig: GoalReminderConfigRequestSchema.nullable().optional(),
    /**
     * Complete desired KR state for aggregate editing. Existing rows carry their ID;
     * rows without an ID are created and existing rows omitted from the list are removed.
     */
    keyResults: z
      .array(
        KeyResultInputSchema.extend({
          id: brandedId<KeyResultId>().optional(),
          description: z.string().max(2000).nullable().optional(),
        }).strict(),
      )
      .max(50)
      .optional(),
  })
  .strict();

export type UpdateGoalReq = z.infer<typeof UpdateGoalSchema>;
export type UpdateGoalRes = import('./response-schemas').GoalMutationReceipt;

export const GoalVersionCommandSchema = z
  .object({ expectedVersion: z.number().int().min(1) })
  .strict();
export type GoalVersionCommandReq = z.infer<typeof GoalVersionCommandSchema>;

// ============================================================================
// GET Goal
// ============================================================================

/**
 * 获取目标详情
 */
export type GetGoalReq = void;
export type GetGoalRes = GoalClientDTO;

/**
 * 删除目标
 */
export type DeleteGoalReq = GoalVersionCommandReq;
export type DeleteGoalRes = import('./response-schemas').GoalMutationReceipt;

// ============================================================================
// QUERY Goals
// ============================================================================

/**
 * Public transport DTO for listing goals - excludes identityId
 * 公共传输 DTO 用于列表目标 - 不包含 identityId
 */
export const ListGoalFiltersSchema = z.object({
  systemView: z.enum(GoalSystemView).optional(),
  status: z.array(z.enum(GoalStatus)).optional(),
  importance: z.array(z.enum(ImportanceLevel)).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folderId: brandedId<GoalFolderId>().optional(),
  query: z.string().max(256).optional(),
  startDate: z.number().int().optional(),
  endDate: z.number().int().optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'targetDate', 'priority'])
    .default('createdAt')
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
  page: z.number().int().min(1).default(1).optional(),
  pageSize: z.number().int().min(1).max(100).default(20).optional(),
  includeKeyResults: z.boolean().default(false).optional(),
  includeReviews: z.boolean().default(false).optional(),
});

export type ListGoalFilters = z.infer<typeof ListGoalFiltersSchema>;

/**
 * Internal application query - used by controller/use case
 * 内部应用查询 - 由控制器/用例使用
 */
export interface ListGoalsQuery extends ListGoalFilters {
  identityId: IdentityId;
}

// QueryGoalsRes 由 response-schemas.ts 中 QueryGoalsResSchema 的 z.infer 导出

// ============================================================================
// AGGREGATE View
// ============================================================================

/**
 * 获取目标聚合视图
 */
export type GetGoalAggregateReq = void;

// GetGoalAggregateRes 由 response-schemas.ts 中 GetGoalAggregateResSchema 的 z.infer 导出

// ============================================================================
// CLONE Goal
// ============================================================================

export const CloneGoalSchema = z
  .object({
    name: GoalNameSchema.optional(),
    description: z.string().max(2000, '描述不能超过 2000 字符').optional(),
    includeKeyResults: z.boolean().optional(),
    includeRecords: z.boolean().optional(),
  })
  .strict();

export type CloneGoalReq = z.infer<typeof CloneGoalSchema>;

// ============================================================================
// BATCH Operations
// ============================================================================

/**
 * 批量更新目标状态 Schema
 */
export const BatchUpdateGoalStatusSchema = z.object({
  goalIds: z.array(brandedId<GoalId>()).min(1, '至少需要选择一个目标'),
  status: z.enum(GoalStatus),
});

export type BatchUpdateGoalStatusReq = z.infer<typeof BatchUpdateGoalStatusSchema>;

/**
 * 批量移动目标 Schema
 */
export const BatchMoveGoalsSchema = z.object({
  goalIds: z.array(brandedId<GoalId>()).min(1),
  targetFolderId: brandedId<GoalFolderId>(),
});

export type BatchMoveGoalsReq = z.infer<typeof BatchMoveGoalsSchema>;

/**
 * 批量删除目标 Schema
 */
export const BatchDeleteGoalsSchema = z.object({
  goalIds: z.array(brandedId<GoalId>()).min(1),
  hardDelete: z.boolean().default(false).optional(),
});

export type BatchDeleteGoalsReq = z.infer<typeof BatchDeleteGoalsSchema>;

// ============================================================================
// IMPORT/EXPORT Operations
// ============================================================================

/**
 * Public transport DTO for export goals - excludes identityId (current-user operation)
 * 公共传输 DTO 用于导出目标 - 不包含 identityId (当前用户操作)
 */
export const ExportGoalFiltersSchema = z.object({
  goalIds: z.array(brandedId<GoalId>()).optional(),
  format: z.enum(['json', 'csv', 'markdown']),
  includeKeyResults: z.boolean().default(true).optional(),
  includeReviews: z.boolean().default(true).optional(),
});

export type ExportGoalFilters = z.infer<typeof ExportGoalFiltersSchema>;

/**
 * Internal export query - used by controller/use case
 * 内部导出查询 - 由控制器/用例使用
 */
export interface ExportGoalsQuery extends ExportGoalFilters {
  identityId: IdentityId;
}

// Residual 791: export goals Res dual retired — sole ResSchema + z.infer.
export const ExportGoalsResSchema = z.object({
  data: z.union([z.string(), z.custom<Uint8Array>((val) => val instanceof Uint8Array)]),
  filename: z.string(),
  mimeType: z.string(),
});
export type ExportGoalsRes = z.infer<typeof ExportGoalsResSchema>;

/**
 * Public transport DTO for import goals - excludes identityId (current-user operation)
 * 公共传输 DTO 用于导入目标 - 不包含 identityId (当前用户操作)
 */
export const ImportGoalPayloadSchema = z.object({
  data: z.union([z.string(), z.custom<Uint8Array>((val) => val instanceof Uint8Array)]),
  format: z.enum(['json', 'csv']),
  folderId: brandedId<GoalFolderId>().optional(),
  overwriteExisting: z.boolean().default(false).optional(),
});

export type ImportGoalPayload = z.infer<typeof ImportGoalPayloadSchema>;

/**
 * Internal import command - used by controller/use case
 * 内部导入命令 - 由控制器/用例使用
 */
export interface ImportGoalsCommand extends ImportGoalPayload {
  identityId: IdentityId;
}

// Residual 791: import goals Res dual retired — sole ResSchema + z.infer.
export const ImportGoalsResSchema = z.object({
  importedCount: z.number(),
  skippedCount: z.number(),
  errors: z
    .array(
      z.object({
        line: z.number(),
        error: z.string(),
      }),
    )
    .optional(),
});
export type ImportGoalsRes = z.infer<typeof ImportGoalsResSchema>;
