/**
 * LinkedResource Entity - Server Interface
 */

import type {
  LinkedResourceId,
  EditorWorkspaceId,
  IdentityId,
  ResourceId,
  TransferDate,
  DomainDate,
  PersistenceDate,
} from '../../../primitives';
import type { LinkedSourceType } from '../value-objects/linked-source-type';
import type { LinkedTargetType } from '../value-objects/linked-target-type';
import type { LinkedResourceClientDTO } from './linked-resource-client';

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

/**
 * Linked Resource Persistence DTO (database fields, snake_case).
 */
export interface LinkedResourcePersistenceDTO {
  id: LinkedResourceId;
  workspace_id: EditorWorkspaceId;
  identityId: IdentityId;
  source_resource_id: ResourceId;
  source_type: LinkedSourceType;
  source_line: number | null;
  source_column: number | null;
  target_path: string;
  target_type: LinkedTargetType;
  target_resource_id: ResourceId | null;
  target_anchor: string | null;
  is_valid: boolean;
  last_validated_at: PersistenceDate | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}
