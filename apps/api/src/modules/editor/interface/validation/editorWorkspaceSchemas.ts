/**
 * EditorWorkspace API 请求验证 Schemas
 * 使用 Zod 进行请求参数验证
 */

import { z } from 'zod';

// ============ 基础验证规则 ============

/**
 * UUID 验证规则
 */
const uuidSchema = z
  .string()
  .uuid({ message: 'Invalid UUID format' })
  .describe('UUID in standard format');

/**
 * 项目类型枚举
 */
const projectTypeSchema = z.enum(['code', 'markdown', 'mixed', 'other'], {
  message: 'Invalid project type. Must be one of: code, markdown, mixed, other'
});

// ============ Workspace 相关 Schemas ============

/**
 * 创建工作区请求验证
 */
export const createWorkspaceSchema = z.object({
  accountUuid: uuidSchema,
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .max(100, 'Workspace name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  projectPath: z
    .string()
    .min(1, 'Project path is required')
    .max(500, 'Project path must be less than 500 characters'),
  projectType: projectTypeSchema,
  layout: z
    .object({
      sidebarWidth: z.number().min(0).max(1000).optional(),
      activityBarWidth: z.number().min(0).max(200).optional(),
      editorWidth: z.number().min(0).max(5000).optional(),
      bottomPanelHeight: z.number().min(0).max(1000).optional(),
    })
    .optional(),
  settings: z
    .object({
      autoSave: z.boolean().optional(),
      autoSaveInterval: z.number().min(1000).max(600000).optional(),
      theme: z.string().max(50).optional(),
    })
    .optional(),
});

/**
 * 更新工作区请求验证
 */
export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name cannot be empty')
    .max(100, 'Workspace name must be less than 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  layout: z
    .object({
      sidebarWidth: z.number().min(0).max(1000).optional(),
      activityBarWidth: z.number().min(0).max(200).optional(),
      editorWidth: z.number().min(0).max(5000).optional(),
      bottomPanelHeight: z.number().min(0).max(1000).optional(),
    })
    .optional(),
  settings: z
    .object({
      autoSave: z.boolean().optional(),
      autoSaveInterval: z.number().min(1000).max(600000).optional(),
      theme: z.string().max(50).optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

/**
 * 获取工作区路径参数验证
 */
export const workspaceUuidParamSchema = z.object({
  uuid: uuidSchema,
});

/**
 * 账户UUID路径参数验证
 */
export const accountUuidParamSchema = z.object({
  accountUuid: uuidSchema,
});

// ============ Session 相关 Schemas ============

/**
 * 添加会话请求验证
 */
export const addSessionSchema = z.object({
  name: z
    .string()
    .min(1, 'Session name is required')
    .max(100, 'Session name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  layout: z
    .object({
      splitType: z.enum(['horizontal', 'vertical', 'grid']).optional(),
      groupCount: z.number().min(1).max(10).optional(),
      activeGroupIndex: z.number().min(0).optional(),
    })
    .optional(),
});

/**
 * 工作区UUID路径参数验证
 */
export const workspaceUuidPathSchema = z.object({
  workspaceUuid: uuidSchema,
});

// ============ 查询参数 Schemas ============

/**
 * 分页查询参数验证
 */
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().min(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100)),
});

/**
 * 工作区过滤查询参数验证
 */
export const workspaceFilterQuerySchema = paginationQuerySchema.extend({
  isActive: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .pipe(z.boolean()),
  projectType: projectTypeSchema.optional(),
});

// ============ 类型导出 ============

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type WorkspaceUuidParam = z.infer<typeof workspaceUuidParamSchema>;
export type AccountUuidParam = z.infer<typeof accountUuidParamSchema>;
export type AddSessionInput = z.infer<typeof addSessionSchema>;
export type WorkspaceUuidPath = z.infer<typeof workspaceUuidPathSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type WorkspaceFilterQuery = z.infer<typeof workspaceFilterQuerySchema>;
