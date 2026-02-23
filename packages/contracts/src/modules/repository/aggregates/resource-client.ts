/**
 * Resource Entity - Client Interface
 * 资源实体 - 客户端接?
 */
import type { ResourceId, RepositoryId, FolderId, DomainDate, TransferDate } from '@/primitives';
import type { ResourceType } from '../value-objects/resource-type';
import type { ResourceStatus } from '../value-objects/resource-status';
import type { ResourceServerDTO } from './resource-server';
import type {
  ResourceMetadata,
  ResourceMetadataDTO,
  ResourceStats,
  ResourceStatsDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * Resource Client DTO
 */
export interface ResourceClientDTO {
  id: ResourceId;
  repositoryId: RepositoryId;
  folderId: FolderId | null;

  name: string;
  type: ResourceType;
  mimeType: string;
  path: string;
  size: number;
  content: string | null;
  metadata: ResourceMetadataDTO;
  stats: ResourceStatsDTO;
  status: ResourceStatus;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
  version: number;

  // UI 计算字段
  isDeleted: boolean;
  isArchived: boolean;
  isActive: boolean;
  isDraft: boolean;
  statusText: string;
  typeText: string;
  displayName: string;
  formattedSize: string;
  createdAtText: string;
  updatedAtText: string;
  extension: string; // ".md"
  icon: string; // Material Design icon name
}
