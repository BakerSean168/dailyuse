/**
 * Resource Entity - Server Interface
 */
import type {
  ResourceId,
  RepositoryId,
  FolderId,
  DomainDate,
  TransferDate,
  PersistenceDate,
} from '../../../primitives';
import type { ResourceType } from '../value-objects/resource-type';
import type { ResourceStatus } from '../value-objects/resource-status';
import type {
  ResourceMetadata,
  ResourceMetadataDTO,
  ResourceStats,
  ResourceStatsDTO,
  ExternalLink,
} from '../value-objects';

// ============ DTO Definitions ============

/**
 * Resource Server DTO
 */
export interface ResourceServerDTO {
  id: string;
  repositoryId: string; // Foreign key - aggregate root ID
  identityId: string;
  folderId: string | null; // Foreign key - parent folder

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

/**
 * Resource Persistence DTO
 */
export interface ResourcePersistenceDTO {
  id: string;
  repositoryId: string;
  folderId: string | null;
  name: string;
  type: ResourceType;
  mimeType: string | null;
  path: string;
  size: number | null;
  content: string | null;
  metadata: string; // JSON string
  stats: string; // JSON string
  status: ResourceStatus;
  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}
