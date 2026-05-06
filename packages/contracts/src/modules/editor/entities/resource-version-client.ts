/**
 * ResourceVersion Entity - Client Interface
 */

import type {
  ResourceVersionId,
  ResourceId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
  DomainDate,
} from '../../../primitives';
import type { VersionChangeType } from '../value-objects/version-change-type';
import type { ResourceVersionServerDTO } from './resource-version-server';

/**
 * Resource Version Client DTO (includes UI formatted fields).
 */
export interface ResourceVersionClientDTO {
  id: ResourceVersionId;
  resourceId: ResourceId;
  workspaceId: EditorWorkspaceId;
  identityId: IdentityId;
  versionNumber: number;
  changeType: VersionChangeType;
  contentHash: string;
  contentDiff: string | null;
  changeDescription: string | null;
  previousVersionId: ResourceVersionId | null;
  createdBy: string | null;
  createdAt: TransferDate;

  // UI formatted fields
  formattedCreatedAt: string;
}
