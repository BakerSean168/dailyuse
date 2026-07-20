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
  CreateResourceSchema,
  type CreateResourceReq as CreateResourceZodReq,
  UpdateResourceSchema,
  type UpdateResourceReq as UpdateResourceZodReq,
  UpdateRepositoryStatsSchema,
  type UpdateRepositoryStatsReq as UpdateRepositoryStatsZodReq,
  CreateFolderSchema,
  type CreateFolderReq as CreateFolderZodReq,
  RenameFolderSchema,
  type RenameFolderReq as RenameFolderZodReq,
  MoveFolderSchema,
  type MoveFolderReq as MoveFolderZodReq,
} from './repository.dto';

export {
  UploadResourcesMetadataSchema,
  type UploadResourcesMetadataZodReq,
  UploadResourcesMultipartSchema,
  type UploadResourcesMultipartZodReq,
} from './upload.dto';

export * from './response-schemas';
export * from './knowledge-repository-connection.dto';
export * from './knowledge-note-projection.dto';
export * from './knowledge-attachment-projection.dto';
