/**
 * Goal - CRUD Operations
 * 
 * 目标的基础增删改查操作，包括批量操作
 */

import { z } from 'zod';
import type { GoalClientDTO } from '../aggregates';

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
  importance: z.enum(['low', 'medium', 'high', 'critical'] as const),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).optional(),
  startDate: z.number().int().optional(),
  targetDate: z.number().int().optional(),
  folderId: z.string().uuid().optional(),
  parentGoalId: z.string().uuid().optional(),
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
  importance: z.enum(['low', 'medium', 'high', 'critical'] as const).optional(),
  category: z.string().max(100).nullable().optional(),
  tags: z.array(z.string().max(50)).nullable().optional(),
  startDate: z.number().int().nullable().optional(),
  targetDate: z.number().int().nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
  parentGoalId: z.string().uuid().nullable().optional(),
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
  identityId: z.string().uuid('账户 ID 无效'),
  status: z.array(z.string()).optional(),
  importance: z.array(z.enum(['low', 'medium', 'high', 'critical'] as const)).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().uuid().optional(),
  keyword: z.string().max(256).optional(),
  startDate: z.number().int().optional(),
  endDate: z.number().int().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'targetDate', 'priority']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
  includeKeyResults: z.boolean().optional().default(false),
  includeReviews: z.boolean().optional().default(false),
});

export type QueryGoalsReq = z.infer<typeof QueryGoalsSchema>;

export interface QueryGoalsRes {
  data: GoalClientDTO[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
}

// ============================================================================
// AGGREGATE View
// ============================================================================

/**
 * 获取目标聚合视图
 */
export type GetGoalAggregateReq = void;

export interface GetGoalAggregateRes {
  goal: GoalClientDTO;
  keyResults?: any[];
  records?: any[];
  reviews?: any[];
  statistics?: {
    totalKeyResults: number;
    completedKeyResults: number;
    totalRecords: number;
    totalReviews: number;
    overallProgress: number;
  };
}

// ============================================================================
// BATCH Operations
// ============================================================================

/**
 * 批量更新目标状态 Schema
 */
export const BatchUpdateGoalStatusSchema = z.object({
  goalIds: z.array(z.string().uuid()).min(1, '至少需要选择一个目标'),
  status: z.string().min(1, '状态不能为空'),
});

export type BatchUpdateGoalStatusReq = z.infer<typeof BatchUpdateGoalStatusSchema>;
export type BatchUpdateGoalStatusRes = GoalClientDTO[];

/**
 * 批量移动目标 Schema
 */
export const BatchMoveGoalsSchema = z.object({
  goalIds: z.array(z.string().uuid()).min(1),
  targetFolderId: z.string().uuid('目标文件夹 UUID 无效'),
});

export type BatchMoveGoalsReq = z.infer<typeof BatchMoveGoalsSchema>;
export type BatchMoveGoalsRes = GoalClientDTO[];

/**
 * 批量删除目标 Schema
 */
export const BatchDeleteGoalsSchema = z.object({
  goalIds: z.array(z.string().uuid()).min(1),
  hardDelete: z.boolean().optional().default(false),
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
  identityId: z.string().uuid('账户 ID 无效'),
  goalIds: z.array(z.string().uuid()).optional(),
  format: z.enum(['json', 'csv', 'markdown']),
  includeKeyResults: z.boolean().optional().default(true),
  includeReviews: z.boolean().optional().default(true),
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
  identityId: z.string().uuid('账户 ID 无效'),
  data: z.union([z.string(), z.instanceof(Uint8Array)]),
  format: z.enum(['json', 'csv']),
  folderId: z.string().uuid().optional(),
  overwriteExisting: z.boolean().optional().default(false),
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
