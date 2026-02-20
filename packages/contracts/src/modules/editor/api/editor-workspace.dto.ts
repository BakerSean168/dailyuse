/**
 * Editor Workspace - Zod Validation Schemas
 * 编辑器工作区 - Zod 验证模式
 */

import { z } from 'zod';
import { openApiJsonValue } from '@/primitives';
import { ProjectType } from '../value-objects/project-type';

const projectTypeValues = Object.values(ProjectType) as [string, ...string[]];

export const CreateEditorWorkspaceSchema = z.object({
  name: z.string().min(1).max(200).describe('工作区名称'),
  description: z.string().max(2000).optional().nullable().describe('工作区描述'),
  projectPath: z.string().min(1).max(500).describe('项目路径'),
  projectType: z.enum(projectTypeValues).describe('项目类型'),
  layout: z.record(z.string(), openApiJsonValue).optional().nullable().describe('工作区布局配置'),
  settings: z.record(z.string(), openApiJsonValue).optional().nullable().describe('工作区设置'),
});

export type CreateEditorWorkspaceReq = z.infer<typeof CreateEditorWorkspaceSchema>;

export const UpdateEditorWorkspaceSchema = z.object({
  name: z.string().min(1).max(200).optional().describe('工作区名称'),
  description: z.string().max(2000).optional().nullable().describe('工作区描述'),
  layout: z.record(z.string(), openApiJsonValue).optional().nullable().describe('工作区布局配置'),
  settings: z.record(z.string(), openApiJsonValue).optional().nullable().describe('工作区设置'),
});

export type UpdateEditorWorkspaceReq = z.infer<typeof UpdateEditorWorkspaceSchema>;
