/**
 * Resource Entity - Client Interface
 * 资源实体 - 客户端接�?
 */
import type { ResourceId, RepositoryId, FolderId, DomainDate, TransferDate } from '@/primitives';
import type { ResourceType } from '../value-objects/resource-type';
import type { ResourceStatus } from '../value-objects/resource-status';
import type { ResourceServerDTO } from './resource-server';
import type {
  ResourceMetadataClient,
  ResourceMetadataClientDTO,
  ResourceStatsClient,
  ResourceStatsClientDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * Resource Client DTO
 */
export interface ResourceClientDTO {
  id: string;
  repositoryId: string;
  folderId: string | null;
  name: string;
  type: ResourceType;
  path: string;
  size: number;
  content: string | null;
  metadata: ResourceMetadataClientDTO;
  stats: ResourceStatsClientDTO;
  status: ResourceStatus;
  createdAt: TransferDate;
  updatedAt: TransferDate;

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

// ============ 实体接口 ============

/**
 * Resource 实体 - Client 接口（实例方法）
 */
export interface ResourceClient {
  // 基础属�?
  id: ResourceId;
  repositoryId: RepositoryId;
  folderId: FolderId | null;
  name: string;
  type: ResourceType;
  path: string;
  size: number;
  content: string | null;
  metadata: ResourceMetadataClient;
  stats: ResourceStatsClient;
  status: ResourceStatus;
  createdAt: DomainDate;
  updatedAt: DomainDate;

  // UI 计算属�?
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
  extension: string;
  icon: string;

  // DTO 转换方法
}

// ============ 静态工厂方法接�?============
