/**
 * ResourceVersion Entity - Server Interface
 */

import type {
  ResourceVersionId,
  ResourceId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
  DomainDate,
  PersistenceDate,
} from '../../../primitives';
import type { VersionChangeType } from '../value-objects/version-change-type';
import type { ResourceVersionClientDTO } from './resource-version-client';

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

/**
 * Resource Version Persistence DTO (database fields, snake_case).
 */
export interface ResourceVersionPersistenceDTO {
  id: ResourceVersionId;
  resource_id: ResourceId;
  workspace_id: EditorWorkspaceId;
  identityId: IdentityId;
  version_number: number;
  change_type: VersionChangeType;
  content_hash: string;
  content_diff: string | null;
  change_description: string | null;
  previous_version_id: ResourceVersionId | null;
  created_by: string | null;
  createdAt: PersistenceDate;
}
