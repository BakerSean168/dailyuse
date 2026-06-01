/**
 * LinkedResource Entity - Server Interface
 */

import type {
  LinkedResourceId,
  EditorWorkspaceId,
  IdentityId,
  ResourceId,
  TransferDate,
} from '../../../primitives';
import type { LinkedSourceType } from '../value-objects/linked-source-type';
import type { LinkedTargetType } from '../value-objects/linked-target-type';
/**
 * Linked Resource Server DTO
 */
export interface LinkedResourceServerDTO {
  id: LinkedResourceId;
  workspaceId: EditorWorkspaceId; // Parent workspace ID (aggregate root FK)
  identityId: IdentityId;
  sourceResourceId: ResourceId; // Source resource ID
  sourceType: LinkedSourceType;
  sourceLine: number | null; // Source position (line number)
  sourceColumn: number | null; // Source position (column number)
  targetPath: string; // Target path (relative or absolute)
  targetType: LinkedTargetType;
  targetResourceId: ResourceId | null; // Target resource ID (if internal resource)
  targetAnchor: string | null; // Target anchor (e.g. #heading-id)
  isValid: boolean; // Whether the link target exists
  lastValidatedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

