/**
 * LinkedResource Entity - Client Interface
 */

import type {
  LinkedResourceId,
  EditorWorkspaceId,
  IdentityId,
  DocumentId,
  TransferDate,
  DomainDate,
} from '../../../primitives';
import type { LinkedSourceType } from '../value-objects/linked-source-type';
import type { LinkedTargetType } from '../value-objects/linked-target-type';
import type { LinkedResourceServerDTO } from './linked-resource-server';

/**
 * Linked Resource Client DTO (includes UI formatted fields).
 */
export interface LinkedResourceClientDTO {
  id: string;
  workspaceId: string;
  identityId: string;
  sourceDocumentId: string;
  sourceType: LinkedSourceType;
  sourceLine: number | null;
  sourceColumn: number | null;
  targetPath: string;
  targetType: LinkedTargetType;
  targetDocumentId: string | null;
  targetAnchor: string | null;
  isValid: boolean;
  lastValidatedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI formatted fields
  formattedLastValidated: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}
