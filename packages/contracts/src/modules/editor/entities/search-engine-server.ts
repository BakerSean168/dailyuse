/**
 * SearchEngine Entity - Server Interface
 */

import type {
  SearchEngineId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
  DomainDate,
  PersistenceDate,
} from '../../../primitives';
import type { SearchEngineClientDTO } from './search-engine-client';

/**
 * Search Engine Server DTO
 */
export interface SearchEngineServerDTO {
  id: SearchEngineId;
  workspaceId: EditorWorkspaceId; // Parent workspace ID (aggregate root FK)
  identityId: IdentityId;
  name: string;
  description: string | null;
  indexPath: string; // Index storage path
  indexedResourceCount: number; // Number of indexed resources
  totalResourceCount: number; // Total resource count
  lastIndexedAt: TransferDate | null;
  isIndexing: boolean; // Whether indexing is in progress
  indexProgress: number | null; // Index progress (0-100)
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * Search Engine Persistence DTO (database fields, snake_case).
 */
export interface SearchEnginePersistenceDTO {
  id: SearchEngineId;
  workspace_id: EditorWorkspaceId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  index_path: string;
  indexed_resource_count: number;
  total_resource_count: number;
  last_indexed_at: PersistenceDate | null;
  is_indexing: boolean;
  index_progress: number | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}
