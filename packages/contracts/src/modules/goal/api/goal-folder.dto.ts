/**
 * Goal - Folder Operations
 *
 * 目标文件夹管理
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { GoalFolderId, IdentityId } from '../../../primitives';
import type { GoalFolderClientDTO } from '../aggregates/goal-folder-client';
import { GoalFolderClientDTOSchema } from './response-schemas';

// ============================================================================
// CREATE Folder
// ============================================================================

/**
 * 创建文件夹 Schema
 */
export const CreateGoalFolderSchema = z.object({
  name: z.string().min(1, '文件夹名称不能为空').max(256),
  description: z.string().max(2000).optional(),
  icon: z.string().max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  parentFolderId: brandedId<GoalFolderId>().optional(),
});

export type CreateGoalFolderReq = z.infer<typeof CreateGoalFolderSchema>;
export type CreateGoalFolderRes = GoalFolderClientDTO;

// ============================================================================
// UPDATE Folder
// ============================================================================

/**
 * 更新文件夹 Schema
 */
export const UpdateGoalFolderSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  description: z.string().max(2000).nullable().optional(),
  icon: z.string().max(100).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .nullable()
    .optional(),
  parentFolderId: brandedId<GoalFolderId>().nullable().optional(),
});

export type UpdateGoalFolderReq = z.infer<typeof UpdateGoalFolderSchema>;
export type UpdateGoalFolderRes = GoalFolderClientDTO;

// ============================================================================
// GET Folder
// ============================================================================

/**
 * 获取文件夹详情
 */
export type GetGoalFolderReq = void;

/**
 * 删除文件夹
 */
export type DeleteGoalFolderReq = void;

// ============================================================================
// QUERY Folders
// ============================================================================

/**
 * Public transport DTO for listing goal folders - excludes identityId
 * 公共传输 DTO 用于列表目标文件夹 - 不包含 identityId
 */
export const ListGoalFolderFiltersSchema = z.object({
  parentFolderId: brandedId<GoalFolderId>().optional(),
  includeSystemFolders: z.boolean().default(false).optional(),
  sortBy: z.enum(['name', 'createdAt', 'sortOrder']).default('name').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
});

export type ListGoalFolderFilters = z.infer<typeof ListGoalFolderFiltersSchema>;

/**
 * Internal application query - used by controller/use case
 * 内部应用查询 - 由控制器/用例使用
 */
export interface ListGoalFoldersQuery extends ListGoalFolderFilters {
  identityId: IdentityId;
}

// Residual 779: QueryGoalFoldersRes dual retired — OpenAPI + transport use ResSchema.
export const QueryGoalFoldersResSchema = z.object({
  data: z.array(GoalFolderClientDTOSchema),
  total: z.number(),
});
export type QueryGoalFoldersRes = z.infer<typeof QueryGoalFoldersResSchema>;
