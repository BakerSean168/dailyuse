/**
 * Repository Aggregate Root - Client Interface
 * 仓储聚合�?- 客户端接�?
 */
import type { RepositoryId, IdentityId, DomainDate, TransferDate } from '@/primitives';
import type { RepositoryType } from '../value-objects/repository-type';
import type { RepositoryStatus } from '../value-objects/repository-status';
import type { RepositoryServerDTO } from './repository-server';
import type {
  RepositoryConfigClient,
  RepositoryConfigClientDTO,
  RepositoryStatsClient,
  RepositoryStatsClientDTO,
} from '../value-objects';
import type { FolderClient, FolderClientDTO } from '../entities/folder-client';

// ============ DTO 定义 ============

/**
 * Repository Client DTO
 */
export interface RepositoryClientDTO {
  id: string;
  identityId: string;
  name: string;
  type: RepositoryType;
  path: string;
  description: string | null;
  config: RepositoryConfigClientDTO;
  stats: RepositoryStatsClientDTO;
  status: RepositoryStatus;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // 子实�?
  folders: FolderClientDTO[] | null;

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
 * Repository 聚合�?- Client 接口（实例方法）
 */
export interface RepositoryClient {
  // 基础属�?
  id: RepositoryId;
  identityId: IdentityId;
  name: string;
  type: RepositoryType;
  path: string;
  description: string | null;
  config: RepositoryConfigClient;
  stats: RepositoryStatsClient;
  status: RepositoryStatus;
  createdAt: DomainDate;
  updatedAt: DomainDate;

  // 子实�?
  folders: FolderClient[] | null;

  // UI 计算属�?
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
