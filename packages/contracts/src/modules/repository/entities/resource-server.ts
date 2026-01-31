/**
 * Resource Entity - Server Interface
 * 资源实体 - 服务端接�?
 */
import type { ResourceId, RepositoryId, FolderId, DomainDate, TransferDate, PersistenceDate } from '@/primitives';
import type { ResourceType } from '../value-objects/resource-type';
import type { ResourceStatus } from '../value-objects/resource-status';
import type {
  ResourceMetadataServer,
  ResourceMetadataServerDTO,
  ResourceStatsServer,
  ResourceStatsServerDTO,
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
  size: number;
  content: string | null; // Markdown 内容 (TEXT)
  metadata: ResourceMetadataServerDTO; // JSONB
  stats: ResourceStatsServerDTO; // JSONB
  status: ResourceStatus;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * Resource Persistence DTO (数据库映�?
 */
export interface ResourcePersistenceDTO {
  id: string;
  repositoryId: string;
  folderId: string | null;
  name: string;
  type: ResourceType;
  path: string;
  size: number;
  content: string | null;
  metadata: string; // JSON string
  stats: string; // JSON string
  status: ResourceStatus;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

// ============ 实体接口 ============

/**
 * Resource 实体 - Server 接口（实例方法）
 */
export interface ResourceServer {
  // 基础属�?
  id: ResourceId;
  repositoryId: RepositoryId;
  folderId: FolderId | null;
  name: string;
  type: ResourceType;
  path: string;
  size: number;
  content: string | null;
  metadata: ResourceMetadataServer;
  stats: ResourceStatsServer;
  status: ResourceStatus;
  createdAt: DomainDate;
  updatedAt: DomainDate;
}
