/**
 * Repository - Zod Validation Schemas
 * 仓库模块 - Zod 验证模式
 */

import { z } from 'zod';
import { openApiJsonValue } from '../../../primitives';

// ==================== Repository Schemas ====================

export const CreateRepositorySchema = z.object({
  name: z.string().min(1).max(200).describe('仓库名称'),
  type: z.string().min(1).max(100).describe('仓库类型'),
  path: z.string().max(500).optional().describe('仓库路径'),
  description: z.string().max(2000).optional().describe('仓库描述'),
  config: z.record(z.string(), openApiJsonValue).optional().describe('仓库配置'),
});

export type CreateRepositoryReq = z.infer<typeof CreateRepositorySchema>;

export const UpdateRepositorySchema = z.object({
  name: z.string().min(1).max(200).optional().describe('仓库名称'),
  description: z.string().max(2000).optional().describe('仓库描述'),
  config: z.record(z.string(), openApiJsonValue).optional().describe('仓库配置'),
});

export type UpdateRepositoryReq = z.infer<typeof UpdateRepositorySchema>;

// ==================== Resource Schemas ====================

export const CreateResourceSchema = z.object({
  repositoryId: z.string().uuid().describe('所属仓库 ID'),
  name: z.string().min(1).max(255).describe('资源名称'),
  type: z.string().min(1).max(100).describe('资源类型'),
  mimeType: z.string().max(200).optional().describe('MIME 类型'),
  content: z.string().optional().describe('资源内容'),
  folderId: z.string().uuid().optional().describe('文件夹 ID'),
});

export type CreateResourceReq = z.infer<typeof CreateResourceSchema>;

export const UpdateResourceSchema = z.object({
  name: z.string().min(1).max(255).optional().describe('资源名称'),
  content: z.string().optional().describe('资源内容'),
  metadata: z.record(z.string(), openApiJsonValue).optional().describe('资源元数据'),
});

export type UpdateResourceReq = z.infer<typeof UpdateResourceSchema>;
