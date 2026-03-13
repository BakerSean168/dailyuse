/**
 * Document Entity - Client Interface
 */

import type {
  DocumentId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
  DomainDate,
} from '../../../primitives';
import type { DocumentLanguage } from '../value-objects/document-language';
import type { IndexStatus } from '../value-objects/index-status';
import type { DocumentServerDTO } from './document-server';

// Value object imports
import type { DocumentMetadataClientDTO } from '../value-objects';

/**
 * Document Client DTO (includes UI formatted fields).
 */
export interface DocumentClientDTO {
  id: string;
  workspaceId: string;
  identityId: string;
  path: string;
  name: string;
  language: DocumentLanguage;
  content: string;
  contentHash: string;
  metadata: DocumentMetadataClientDTO;
  indexStatus: IndexStatus;
  lastIndexedAt: TransferDate | null;
  lastModifiedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI formatted fields
  formattedLastIndexed: string | null;
  formattedLastModified: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}
