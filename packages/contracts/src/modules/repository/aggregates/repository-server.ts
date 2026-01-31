/**
 * Repository Aggregate Root - Server Interface
 * 仓储聚合�?- 服务端接�?
 */
import type { RepositoryId, IdentityId, DomainDate, TransferDate, PersistenceDate } from '@/primitives';
import type { RepositoryType } from '../value-objects/repository-type';
import type { RepositoryStatus } from '../value-objects/repository-status';
import type {
  RepositoryConfigServer,
  RepositoryConfigServerDTO,
  RepositoryStatsServer,
  RepositoryStatsServerDTO,
} from '../value-objects';
import type { FolderServer, FolderServerDTO } from '../entities/folder-server';

// ============ DTO 定义 ============

/**
 * Repository Server DTO
 */
export interface RepositoryServerDTO {
  id: string;
  identityId: string;
  name: string;
  type: RepositoryType;
  path: string;
  description: string | null;
  config: RepositoryConfigServerDTO;
  stats: RepositoryStatsServerDTO;
  status: RepositoryStatus;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // 子实体（可选加载）
  folders: FolderServerDTO[] | null;
}

/**
 * Repository Persistence DTO (数据库映�?
 * 扁平化结构，直接映射数据库字�?
 */
export interface RepositoryPersistenceDTO {
  id: string;
  identityId: string;
  name: string;
  type: RepositoryType;
  path: string;
  description: string | null;
  config: string; // JSON string
  stats: string; // JSON string
  status: RepositoryStatus;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  
  // 注意：子实体（folders）在数据库中是独立表，通过外键关联
}

// ============ 实体接口 ============

/**
 * Repository 聚合�?- Server 接口（实例方法）
 */
export interface RepositoryServer {
  // 基础属�?
  id: RepositoryId;
  identityId: IdentityId;
  name: string;
  type: RepositoryType;
  path: string;
  description: string | null;
  config: RepositoryConfigServer;
  stats: RepositoryStatsServer;
  status: RepositoryStatus;
  createdAt: DomainDate;
  updatedAt: DomainDate;

  // 子实�?
  folders: FolderServer[] | null;

  // 方法
  updateConfig(newConfig: Partial<RepositoryConfigServer>): void;
  updateStats(newStats: Partial<RepositoryStatsServer>): void;
  archive(): void;
  activate(): void;
  delete(): void;

  // DTO 转换方法
  toServerDTO(includeFolders?: boolean): RepositoryServerDTO;
}

// ============ 静态工厂方法接�?============
}
