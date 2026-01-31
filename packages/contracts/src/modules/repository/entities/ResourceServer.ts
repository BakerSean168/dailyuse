/**
 * Resource Entity - Server Interface
 * 资源实体 - 服务端接口
 */
import type { ResourceType, ResourceStatus } from '../enums';
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
  uuid: string;
  repositoryUuid: string; // 外键 - 聚合根ID
  folderUuid?: string | null; // 外键 - 所属文件夹
  name: string;
  type: ResourceType;
  path: string;
  size: number;
  content?: string | null; // Markdown 内容 (TEXT)
  metadata: ResourceMetadataServerDTO; // JSONB
  stats: ResourceStatsServerDTO; // JSONB
  status: ResourceStatus;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

/**
 * Resource Persistence DTO (数据库映射)
 */
export interface ResourcePersistenceDTO {
  uuid: string;
  repositoryUuid: string;
  folderUuid?: string | null;
  name: string;
  type: ResourceType;
  path: string;
  size: number;
  content?: string | null;
  metadata: string; // JSON string
  stats: string; // JSON string
  status: ResourceStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============ 实体接口 ============

/**
 * Resource 实体 - Server 接口（实例方法）
 */
export interface ResourceServer {
  // 基础属性
  uuid: string;
  repositoryUuid: string;
  folderUuid?: string | null;
  name: string;
  type: ResourceType;
  path: string;
  size: number;
  content?: string | null;
  metadata: ResourceMetadataServer;
  stats: ResourceStatsServer;
  status: ResourceStatus;
  createdAt: Date;
  updatedAt: Date;

  // 内容操作方法
  updateMarkdownContent(content: string): void;
  getMarkdownContent(): string;
  clearContent(): void;

  // 元数据方法
  updateMetadata(newMetadata: Partial<ResourceMetadataServerDTO>): void;
  updateStats(newStats: Partial<ResourceStatsServerDTO>): void;
  
  // 状态管理
  archive(): void;
  activate(): void;
  delete(): void;
  moveTo(folderUuid: string | null): void;

  // DTO 转换方法}
