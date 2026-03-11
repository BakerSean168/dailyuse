import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { RepositoryId, ResourceId } from '../../../primitives';

export const CreateResourceBookmarkSchema = z.object({
  resourceId: brandedId<ResourceId>().describe('资源 ID'),
  aliasName: z.string().min(1).max(255).optional().describe('书签别名'),
  icon: z.string().max(100).optional().describe('图标'),
  color: z.string().max(50).optional().describe('颜色'),
});

export type CreateResourceBookmarkZodReq = z.infer<typeof CreateResourceBookmarkSchema>;

export const UpdateResourceBookmarkSchema = z.object({
  aliasName: z.string().min(1).max(255).nullable().optional().describe('书签别名'),
  icon: z.string().max(100).nullable().optional().describe('图标'),
  color: z.string().max(50).nullable().optional().describe('颜色'),
});

export type UpdateResourceBookmarkZodReq = z.infer<typeof UpdateResourceBookmarkSchema>;

export const ReorderResourceBookmarksSchema = z.object({
  bookmarkIds: z.array(z.string().min(1)).min(1).describe('按目标顺序排列的书签 ID 列表'),
});

export type ReorderResourceBookmarksZodReq = z.infer<typeof ReorderResourceBookmarksSchema>;

export const RepositoryBookmarkRouteParamsSchema = z.object({
  repoId: brandedId<RepositoryId>(),
  bookmarkId: z.string().min(1).optional(),
});
