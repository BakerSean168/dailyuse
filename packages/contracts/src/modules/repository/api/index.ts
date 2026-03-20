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
} from './repository.dto';

export {
  UploadResourcesMetadataSchema,
  type UploadResourcesMetadataZodReq,
  UploadResourcesMultipartSchema,
  type UploadResourcesMultipartZodReq,
} from './upload.dto';

export * from './response-schemas';
