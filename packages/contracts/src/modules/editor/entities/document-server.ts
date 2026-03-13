/**
 * Document Entity - Server Interface
 */

import type {
  DocumentId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
  DomainDate,
  PersistenceDate,
} from '../../../primitives';
import type { DocumentLanguage } from '../value-objects/document-language';
import type { IndexStatus } from '../value-objects/index-status';
import type { DocumentClientDTO } from './document-client';

// Value object imports
import type { DocumentMetadataServerDTO } from '../value-objects';

/**
 * Document Server DTO
 */
export interface DocumentServerDTO {
  id: DocumentId;
  workspaceId: EditorWorkspaceId; // Parent workspace ID (aggregate root FK)
  identityId: IdentityId;
  path: string; // Document path (relative to workspace root)
  name: string; // Document name (including extension)
  language: DocumentLanguage;
  content: string;
  contentHash: string; // Content hash (for change detection)
  metadata: DocumentMetadataServerDTO;
  indexStatus: IndexStatus;
  lastIndexedAt: TransferDate | null;
  lastModifiedAt: TransferDate | null; // File system modification time
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * Document Persistence DTO (database fields, snake_case).
 */
export interface DocumentPersistenceDTO {
  id: DocumentId;
  workspace_id: EditorWorkspaceId;
  identityId: IdentityId;
  path: string;
  name: string;
  language: DocumentLanguage;
  content: string;
  content_hash: string;
  metadata: string; // JSON string
  index_status: IndexStatus;
  last_indexed_at: PersistenceDate | null;
  last_modified_at: PersistenceDate | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}
