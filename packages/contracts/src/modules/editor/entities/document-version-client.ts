/**
 * DocumentVersion Entity - Client Interface
 */

import type {
  DocumentVersionId,
  DocumentId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
  DomainDate,
} from '../../../primitives';
import type { VersionChangeType } from '../value-objects/version-change-type';
import type { DocumentVersionServerDTO } from './document-version-server';

/**
 * Document Version Client DTO (includes UI formatted fields).
 */
export interface DocumentVersionClientDTO {
  id: string;
  documentId: string;
  workspaceId: string;
  identityId: string;
  versionNumber: number;
  changeType: VersionChangeType;
  contentHash: string;
  contentDiff: string | null;
  changeDescription: string | null;
  previousVersionId: string | null;
  createdBy: string | null;
  createdAt: TransferDate;

  // UI formatted fields
  formattedCreatedAt: string;
}
