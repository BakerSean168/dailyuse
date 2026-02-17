/**
 * Goal - Folder Operations
 * 
 * 目标文件夹管理
 */

import { z } from 'zod';
import { brandedId } from '@/primitives';
import type { GoalFolderId, IdentityId } from '@/primitives';
import type { GoalFolderClientDTO } from '../aggregates';

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
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
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
  color: z.string().regex(/^#[0-9A-F]{6}$/i).nullable().optional(),
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
export type GetGoalFolderRes = GoalFolderClientDTO;

/**
 * 删除文件夹
 */
export type DeleteGoalFolderReq = void;
export type DeleteGoalFolderRes = GoalFolderClientDTO;

// ============================================================================
// QUERY Folders
// ============================================================================

/**
 * 查询文件夹列表 Schema
 */
export const QueryGoalFoldersSchema = z.object({
  identityId: brandedId<IdentityId>(),
  parentFolderId: brandedId<GoalFolderId>().optional(),
  includeSystemFolders: z.boolean().optional().default(false),
  sortBy: z.enum(['name', 'createdAt', 'sortOrder']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type QueryGoalFoldersReq = z.infer<typeof QueryGoalFoldersSchema>;

export interface QueryGoalFoldersRes {
  data: GoalFolderClientDTO[];
  total: number;
}
