/**
 * Resource Entity - Server Interface
 * 资源实体 - 服务端接�?
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

// ============ DTO 定义 ============

/**
 * Resource Server DTO
 */
export interface ResourceServerDTO {
  id: string;
  repositoryId: string; // 外键 - 聚合根ID
  folderId: string | null; // 外键 - 所属文件夹

  name: string;

  type: ResourceType;
  path: string;

  content: string | null; // Markdown 内容 (TEXT)
  externalLinks: ExternalLink[] | null; // 外部链接列表 (ARRAY)

  // file
  mimeType: string | null;
  size: number | null;

  // folder
  childrenCount: number | null;

  metadata: ResourceMetadataDTO; // JSONB
  stats: ResourceStatsDTO; // JSONB
  status: ResourceStatus;

  // 同步字段
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
