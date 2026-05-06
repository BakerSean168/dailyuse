/**
 * SearchEngine Entity - Client Interface
 */

import type {
  SearchEngineId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
  DomainDate,
} from '../../../primitives';
import type { SearchEngineServerDTO } from './search-engine-server';

/**
 * Search Engine Client DTO (includes UI formatted fields).
 */
export interface SearchEngineClientDTO {
  id: SearchEngineId;
  workspaceId: EditorWorkspaceId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  indexPath: string;
  indexedResourceCount: number;
  totalResourceCount: number;
  lastIndexedAt: TransferDate | null;
  isIndexing: boolean;
  indexProgress: number | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI formatted fields
  formattedLastIndexed: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}
