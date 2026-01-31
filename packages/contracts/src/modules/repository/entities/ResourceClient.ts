/**
 * Resource Entity - Client Interface
 * 资源实体 - 客户端接口
 */
import type { ResourceType, ResourceStatus } from '../enums';
import type { ResourceServerDTO } from './ResourceServer';
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
  uuid: string;
  repositoryUuid: string;
  folderUuid?: string | null;
  name: string;
  type: ResourceType;
  path: string;
  size: number;
  content?: string | null;
  metadata: ResourceMetadataClientDTO;
  stats: ResourceStatsClientDTO;
  status: ResourceStatus;
  createdAt: number;
  updatedAt: number;

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
  // 基础属性
  uuid: string;
  repositoryUuid: string;
  folderUuid?: string | null;
  name: string;
  type: ResourceType;
  path: string;
  size: number;
  content?: string | null;
  metadata: ResourceMetadataClient;
  stats: ResourceStatsClient;
  status: ResourceStatus;
  createdAt: Date;
  updatedAt: Date;

  // UI 计算属性
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

  // DTO 转换方法}
