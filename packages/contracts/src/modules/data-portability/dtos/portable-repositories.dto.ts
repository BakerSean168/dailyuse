/**
 * Portable Repositories DTOs
 */

import { z } from 'zod';
import { PortableRefSchema, IsoDateString } from './portable-common.dto';

export const PortableRepositorySchema = z
  .object({
    _ref: PortableRefSchema,
    name: z.string(),
    type: z.string(),
    path: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    config: z.unknown(),
    status: z.string(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export type PortableRepository = z.infer<typeof PortableRepositorySchema>;

export const PortableResourceFolderSchema = z
  .object({
    _ref: PortableRefSchema,
    repositoryRef: PortableRefSchema,
    parentRef: PortableRefSchema.nullable().optional(),
    name: z.string(),
    path: z.string(),
    order: z.number(),
    isExpanded: z.boolean(),
    metadata: z.unknown().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export type PortableResourceFolder = z.infer<typeof PortableResourceFolderSchema>;

export const PortableResourceSchema = z
  .object({
    _ref: PortableRefSchema,
    repositoryRef: PortableRefSchema,
    folderRef: PortableRefSchema.nullable().optional(),
    type: z.string(),
    name: z.string(),
    path: z.string(),
    size: z.number().nullable().optional(),
    content: z.string().nullable().optional(),
    metadata: z.unknown().optional(),
    status: z.string(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export type PortableResource = z.infer<typeof PortableResourceSchema>;

export const PortableRepositoryDataSchema = z
  .object({
    repositories: z.array(PortableRepositorySchema),
    folders: z.array(PortableResourceFolderSchema),
    resources: z.array(PortableResourceSchema),
  })
  .strict();

export type PortableRepositoryData = z.infer<typeof PortableRepositoryDataSchema>;
