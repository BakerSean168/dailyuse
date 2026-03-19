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
  id: string;
  resourceId: string;
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
