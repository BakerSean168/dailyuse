/**
 * Repository Aggregate Root - Client Interface
 * 仓储聚合根 - 客户端接口
 */
import type { RepositoryType, RepositoryStatus } from '../enums';
import type { RepositoryServerDTO } from './RepositoryServer';
import type {
  RepositoryConfigClient,
  RepositoryConfigClientDTO,
  RepositoryStatsClient,
  RepositoryStatsClientDTO,
} from '../value-objects';
import type { FolderClient, FolderClientDTO } from '../entities/FolderClient';

// ============ DTO 定义 ============

/**
 * Repository Client DTO
 */
export interface RepositoryClientDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string | null;
  config: RepositoryConfigClientDTO;
  stats: RepositoryStatsClientDTO;
  status: RepositoryStatus;
  createdAt: number;
  updatedAt: number;

  // 子实体
  folders?: FolderClientDTO[] | null;

  // UI 计算字段
  isDeleted: boolean;
  isArchived: boolean;
  isActive: boolean;
  statusText: string;
  typeText: string;
  folderCount: number;
  resourceCount: number;
  totalSize: number;
  formattedSize: string;
  createdAtText: string;
  updatedAtText: string;
}

// ============ 实体接口 ============

/**
 * Repository 聚合根 - Client 接口（实例方法）
 */
export interface RepositoryClient {
  // 基础属性
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string | null;
  config: RepositoryConfigClient;
  stats: RepositoryStatsClient;
  status: RepositoryStatus;
  createdAt: Date;
  updatedAt: Date;

  // 子实体
  folders?: FolderClient[] | null;

  // UI 计算属性
  isDeleted: boolean;
  isArchived: boolean;
  isActive: boolean;
  statusText: string;
  typeText: string;
  folderCount: number;
  resourceCount: number;
  totalSize: number;
  formattedSize: string;
  createdAtText: string;
  updatedAtText: string;

  // 方法
  updateConfig(newConfig: Partial<RepositoryConfigClient>): void;
  updateStats(newStats: Partial<RepositoryStatsClient>): void;
  archive(): void;
  activate(): void;

  // DTO 转换方法
  toClientDTO(includeFolders?: boolean): RepositoryClientDTO;
  toServerDTO(includeFolders?: boolean): RepositoryServerDTO;
}
