/**
 * Editor Document - Zod Validation Schemas
 * 编辑器文档 - Zod 验证模式
 */

import { z } from 'zod';
import { openApiJsonValue } from '@/primitives';
import { DocumentLanguage } from '../value-objects/document-language';

export const CreateDocumentSchema = z.object({
  workspaceId: z.string().uuid().describe('所属工作区 ID'),
  path: z.string().min(1).max(1000).describe('文档路径'),
  name: z.string().min(1).max(255).describe('文档名称'),
  language: z.enum(DocumentLanguage).describe('文档语言/格式'),
  content: z.string().describe('文档内容'),
  metadata: z.record(z.string(), openApiJsonValue).optional().nullable().describe('文档元数据'),
});

export type CreateDocumentReq = z.infer<typeof CreateDocumentSchema>;

export const UpdateDocumentSchema = z.object({
  content: z.string().optional().describe('文档内容'),
  metadata: z.record(z.string(), openApiJsonValue).optional().nullable().describe('文档元数据'),
});

export type UpdateDocumentReq = z.infer<typeof UpdateDocumentSchema>;
