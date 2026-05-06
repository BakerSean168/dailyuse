import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { FolderId } from '../../../primitives';

export const UploadResourcesMetadataSchema = z.object({
  folderId: brandedId<FolderId>().optional().describe('目标文件夹 ID'),
  tags: z.array(z.string().min(1).max(100)).optional().describe('资源标签'),
  overwritePolicy: z.enum(['skip', 'replace']).optional().describe('冲突处理策略'),
});

export type UploadResourcesMetadataZodReq = z.infer<typeof UploadResourcesMetadataSchema>;

const MultipartBinaryFilesSchema = z
  .unknown()
  .refine((value) => value !== undefined, 'At least one file is required')
  .openapi({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  .describe('待上传文件');

export const UploadResourcesMultipartSchema = z.object({
  files: MultipartBinaryFilesSchema,
  folderId: brandedId<FolderId>().optional().describe('目标文件夹 ID'),
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe('标签 JSON 或重复字段'),
  overwritePolicy: z.enum(['skip', 'replace']).optional().describe('冲突处理策略'),
});

export type UploadResourcesMultipartZodReq = z.infer<typeof UploadResourcesMultipartSchema>;
