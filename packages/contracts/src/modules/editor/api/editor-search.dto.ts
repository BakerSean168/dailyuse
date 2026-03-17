/**
 * Editor Search - Zod Validation Schemas
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { EditorWorkspaceId, SearchEngineId } from '../../../primitives';

export const SearchEditorDocumentsSchema = z.object({
  query: z.string().trim().min(1).describe('Search query'),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  workspaceId: brandedId<EditorWorkspaceId>().optional(),
  searchEngineId: brandedId<SearchEngineId>().optional(),
});

export type SearchEditorDocumentsReq = z.infer<typeof SearchEditorDocumentsSchema>;
