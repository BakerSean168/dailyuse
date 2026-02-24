/**
 * Goal - CRUD Operations
 * 
 * 目标的基础增删改查操作，包括批量操作
 */

import { z } from 'zod';
import { brandedId } from '@/primitives';
import type { GoalId, IdentityId, GoalFolderId } from '@/primitives';
import type { GoalClientDTO } from '../aggregates';
import { GoalStatus } from '../value-objects/goal-status';
import { ImportanceLevel } from '../../../shared/value-objects/importance';

// ============================================================================
// CREATE Goal
// ============================================================================

/**
 * 创建目标 Schema
 */
export const CreateGoalSchema = z.object({
  title: z.string().min(1, '目标标题不能为空').max(256, '目标标题不能超过 256 字符'),
  description: z.string().max(2000, '描述不能超过 2000 字符').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, '颜色必须是有效的 hex 格式').optional(),
  feasibilityAnalysis: z.string().max(2000).optional(),
  motivation: z.string().max(2000).optional(),
  importance: z.enum(ImportanceLevel),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).optional(),
  startDate: z.number().int().optional(),
  targetDate: z.number().int().optional(),
  folderId: brandedId<GoalFolderId>().optional(),
  parentGoalId: brandedId<GoalId>().optional(),
});

export type CreateGoalReq = z.infer<typeof CreateGoalSchema>;
export type CreateGoalRes = GoalClientDTO;

// ============================================================================
// UPDATE Goal
// ============================================================================

/**
 * 更新目标 Schema
 */
export const UpdateGoalSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  description: z.string().max(2000).nullable().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).nullable().optional(),
  feasibilityAnalysis: z.string().max(2000).nullable().optional(),
  motivation: z.string().max(2000).nullable().optional(),
  importance: z.enum(ImportanceLevel).optional(),
  category: z.string().max(100).nullable().optional(),
  tags: z.array(z.string().max(50)).nullable().optional(),
  startDate: z.number().int().nullable().optional(),
  targetDate: z.number().int().nullable().optional(),
  folderId: brandedId<GoalFolderId>().nullable().optional(),
  parentGoalId: brandedId<GoalId>().nullable().optional(),
});

export type UpdateGoalReq = z.infer<typeof UpdateGoalSchema>;
export type UpdateGoalRes = GoalClientDTO;

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
export type DeleteGoalReq = void;
export type DeleteGoalRes = GoalClientDTO;

// ============================================================================
// QUERY Goals
// ============================================================================

/**
 * 查询目标列表 Schema
 */
export const QueryGoalsSchema = z.object({
  identityId: brandedId<IdentityId>(),
  status: z.array(z.enum(GoalStatus)).optional(),
  importance: z.array(z.enum(ImportanceLevel)).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folderId: brandedId<GoalFolderId>().optional(),
  keyword: z.string().max(256).optional(),
  startDate: z.number().int().optional(),
  endDate: z.number().int().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'targetDate', 'priority']).default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
  page: z.number().int().min(1).default(1).optional(),
  pageSize: z.number().int().min(1).max(100).default(20).optional(),
  includeKeyResults: z.boolean().default(false).optional(),
  includeReviews: z.boolean().default(false).optional(),
});

export type QueryGoalsReq = z.infer<typeof QueryGoalsSchema>;

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
export type BatchUpdateGoalStatusRes = GoalClientDTO[];

/**
 * 批量移动目标 Schema
 */
export const BatchMoveGoalsSchema = z.object({
  goalIds: z.array(brandedId<GoalId>()).min(1),
  targetFolderId: brandedId<GoalFolderId>(),
});

export type BatchMoveGoalsReq = z.infer<typeof BatchMoveGoalsSchema>;
export type BatchMoveGoalsRes = GoalClientDTO[];

/**
 * 批量删除目标 Schema
 */
export const BatchDeleteGoalsSchema = z.object({
  goalIds: z.array(brandedId<GoalId>()).min(1),
  hardDelete: z.boolean().default(false).optional(),
});

export type BatchDeleteGoalsReq = z.infer<typeof BatchDeleteGoalsSchema>;
export type BatchDeleteGoalsRes = void;

// ============================================================================
// IMPORT/EXPORT Operations
// ============================================================================

/**
 * 导出目标 Schema
 */
export const ExportGoalsSchema = z.object({
  identityId: brandedId<IdentityId>(),
  goalIds: z.array(brandedId<GoalId>()).optional(),
  format: z.enum(['json', 'csv', 'markdown']),
  includeKeyResults: z.boolean().default(true).optional(),
  includeReviews: z.boolean().default(true).optional(),
});

export type ExportGoalsReq = z.infer<typeof ExportGoalsSchema>;

export interface ExportGoalsRes {
  data: string | Uint8Array;
  filename: string;
  mimeType: string;
}

/**
 * 导入目标 Schema
 */
export const ImportGoalsSchema = z.object({
  identityId: brandedId<IdentityId>(),
  data: z.union([z.string(), z.custom<Uint8Array>((val) => val instanceof Uint8Array)]),
  format: z.enum(['json', 'csv']),
  folderId: brandedId<GoalFolderId>().optional(),
  overwriteExisting: z.boolean().default(false).optional(),
});

export type ImportGoalsReq = z.infer<typeof ImportGoalsSchema>;

export interface ImportGoalsRes {
  importedCount: number;
  skippedCount: number;
  errors?: Array<{
    line: number;
    error: string;
  }>;
}
