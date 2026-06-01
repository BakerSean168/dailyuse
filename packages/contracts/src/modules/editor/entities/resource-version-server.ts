/**
 * ResourceVersion Entity - Server Interface
 */

import type {
  ResourceVersionId,
  ResourceId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
} from '../../../primitives';
import type { VersionChangeType } from '../value-objects/version-change-type';
/**
 * Resource Version Server DTO
 */
export interface ResourceVersionServerDTO {
  id: ResourceVersionId;
  resourceId: ResourceId; // Parent resource ID
  workspaceId: EditorWorkspaceId; // Parent workspace ID (aggregate root FK)
  identityId: IdentityId;
  versionNumber: number; // Auto-incrementing version number
  changeType: VersionChangeType;
  contentHash: string; // Content hash
  contentDiff: string | null; // Content diff
  changeDescription: string | null; // Change description
  previousVersionId: ResourceVersionId | null; // Previous version ID
  createdBy: string | null; // Creator
  createdAt: TransferDate;
}

