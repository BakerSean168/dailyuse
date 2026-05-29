/**
 * Resource Entity - Server Interface
 */
import type {
  ResourceId,
  RepositoryId,
  FolderId,
  IdentityId,
  TransferDate,
} from '../../../primitives';
import type { ResourceType } from '../value-objects/resource-type';
import type { ResourceStatus } from '../value-objects/resource-status';
import type {
  ResourceMetadataDTO,
  ResourceStatsDTO,
  ExternalLink,
} from '../value-objects';

// ============ DTO Definitions ============

/**
 * Resource Server DTO
 */
export interface ResourceServerDTO {
  id: ResourceId;
  repositoryId: RepositoryId; // Foreign key - aggregate root ID
  identityId: IdentityId;
  folderId: FolderId | null; // Foreign key - parent folder

  name: string;

  type: ResourceType;
  path: string;

  content: string | null; // Markdown content (TEXT)
  externalLinks: ExternalLink[] | null; // External links list (ARRAY)

  // file
  mimeType: string | null;
  size: number | null;

  // folder
  childrenCount: number | null;

  metadata: ResourceMetadataDTO; // JSONB
  stats: ResourceStatsDTO; // JSONB
  status: ResourceStatus;

  // Sync fields
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

