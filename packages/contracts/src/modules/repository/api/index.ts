import type { RepositoryClientDTO, ResourceClientDTO } from '../aggregates';
import type { ResourceBookmarkClientDTO } from '../entities';

// ============ Zod Validation Schemas ============
export {
  CreateResourceBookmarkSchema,
  type CreateResourceBookmarkZodReq,
  UpdateResourceBookmarkSchema,
  type UpdateResourceBookmarkZodReq,
  ReorderResourceBookmarksSchema,
  type ReorderResourceBookmarksZodReq,
} from './bookmark.dto';

export {
  CreateRepositorySchema,
  type CreateRepositoryReq as CreateRepositoryZodReq,
  UpdateRepositorySchema,
  type UpdateRepositoryReq as UpdateRepositoryZodReq,
  CreateResourceSchema,
  type CreateResourceReq as CreateResourceZodReq,
  UpdateResourceSchema,
  type UpdateResourceReq as UpdateResourceZodReq,
} from './repository.dto';

export {
  UploadResourcesMetadataSchema,
  type UploadResourcesMetadataZodReq,
  UploadResourcesMultipartSchema,
  type UploadResourcesMultipartZodReq,
} from './upload.dto';

export * from './response-schemas';

// ============ Legacy Interfaces (kept for backward compatibility) ============

export interface CreateRepositoryReq {
  name: string;
  type: string;
  path?: string;
  description?: string;
  config?: Record<string, unknown>;
}
export type CreateRepositoryRes = RepositoryClientDTO;

export interface UpdateRepositoryReq {
  repositoryId: string;
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
}
export type UpdateRepositoryRes = RepositoryClientDTO;

export interface GetRepositoryReq {
  repositoryId: string;
}
export type GetRepositoryRes = RepositoryClientDTO;

export interface ListRepositoryReq {
  status?: string;
  type?: string;
}
export type ListRepositoryRes = RepositoryClientDTO[];

export interface CreateResourceReq {
  name: string;
  type: string;
  mimeType?: string;
  content?: string;
  folderId?: string;
}
export type CreateResourceRes = ResourceClientDTO;

export interface UpdateResourceReq {
  resourceId: string;
  name?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}
export type UpdateResourceRes = ResourceClientDTO;

export interface GetResourceReq {
  resourceId: string;
}
export type GetResourceRes = ResourceClientDTO;

export interface ListResourceReq {
  repositoryId: string;
  folderId?: string;
  status?: string;
}
export type ListResourceRes = ResourceClientDTO[];

export interface ResourceBookmarkCreateReq {
  resourceId: string;
  name?: string;
}
export type ResourceBookmarkCreateRes = ResourceBookmarkClientDTO;

export interface UploadResourcesReq {
  repositoryId: string;
  folderId?: string;
  tags?: string[];
  overwritePolicy?: 'skip' | 'replace';
}
