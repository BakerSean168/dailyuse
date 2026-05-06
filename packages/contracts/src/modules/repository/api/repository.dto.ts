/**
 * Repository - Zod Validation Schemas
 * 仓库模块 - Zod 验证模式
 */

import { z } from 'zod';
import { brandedId, openApiJsonValue } from '../../../primitives';
import type { RepositoryId, FolderId } from '../../../primitives';

// ==================== Resource Schemas ====================

export const CreateResourceSchema = z.object({
  name: z.string().min(1).max(255).describe('资源名称'),
  type: z.string().min(1).max(100).describe('资源类型'),
  mimeType: z.string().max(200).optional().describe('MIME 类型'),
  content: z.string().optional().describe('资源内容'),
  folderId: brandedId<FolderId>().optional().describe('文件夹 ID'),
});

export type CreateResourceReq = z.infer<typeof CreateResourceSchema>;

export const UpdateResourceSchema = z.object({
  name: z.string().min(1).max(255).optional().describe('资源名称'),
  content: z.string().optional().describe('资源内容'),
  metadata: z.record(z.string(), openApiJsonValue).optional().describe('资源元数据'),
});

export type UpdateResourceReq = z.infer<typeof UpdateResourceSchema>;

export const UpdateRepositoryStatsSchema = z.object({
  resourceCount: z.number().int().min(0).optional().describe('资源数量'),
  folderCount: z.number().int().min(0).optional().describe('文件夹数量'),
  totalSize: z.number().int().min(0).optional().describe('总大小 (bytes)'),
});

export type UpdateRepositoryStatsReq = z.infer<typeof UpdateRepositoryStatsSchema>;

export const CreateFolderSchema = z.object({
  name: z.string().min(1).max(255).describe('文件夹名称'),
  parentId: brandedId<FolderId>().optional().describe('父文件夹 ID'),
  order: z.number().int().optional().describe('排序值'),
});

export type CreateFolderReq = z.infer<typeof CreateFolderSchema>;

export const RenameFolderSchema = z.object({
  name: z.string().min(1).max(255).describe('文件夹新名称'),
});

export type RenameFolderReq = z.infer<typeof RenameFolderSchema>;

export const MoveFolderSchema = z.object({
  parentId: brandedId<FolderId>().nullable().optional().describe('新的父文件夹 ID；null 表示移动到根节点'),
});

export type MoveFolderReq = z.infer<typeof MoveFolderSchema>;
