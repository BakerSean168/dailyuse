/**
 * DocumentVersion Entity - Server Interface
 */

import type {
  DocumentVersionId,
  DocumentId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
  DomainDate,
  PersistenceDate,
} from '../../../primitives';
import type { VersionChangeType } from '../value-objects/version-change-type';
import type { DocumentVersionClientDTO } from './document-version-client';

/**
 * Document Version Server DTO
 */
export interface DocumentVersionServerDTO {
  id: DocumentVersionId;
  documentId: DocumentId; // Parent document ID
  workspaceId: EditorWorkspaceId; // Parent workspace ID (aggregate root FK)
  identityId: IdentityId;
  versionNumber: number; // Auto-incrementing version number
  changeType: VersionChangeType;
  contentHash: string; // Content hash
  contentDiff: string | null; // Content diff
  changeDescription: string | null; // Change description
  previousVersionId: DocumentVersionId | null; // Previous version ID
  createdBy: string | null; // Creator
  createdAt: TransferDate;
}

/**
 * Document Version Persistence DTO (database fields, snake_case).
 */
export interface DocumentVersionPersistenceDTO {
  id: DocumentVersionId;
  document_id: DocumentId;
  workspace_id: EditorWorkspaceId;
  identityId: IdentityId;
  version_number: number;
  change_type: VersionChangeType;
  content_hash: string;
  content_diff: string | null;
  change_description: string | null;
  previous_version_id: DocumentVersionId | null;
  created_by: string | null;
  createdAt: PersistenceDate;
}
