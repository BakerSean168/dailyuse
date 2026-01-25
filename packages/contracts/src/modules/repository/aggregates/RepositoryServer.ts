/**
 * Repository Aggregate Root - Server Interface
 * 仓储聚合根 - 服务端接口
 */
import type { RepositoryType, RepositoryStatus } from '../enums';
import type {
  RepositoryConfigServer,
  RepositoryConfigServerDTO,
  RepositoryStatsServer,
  RepositoryStatsServerDTO,
} from '../value-objects';
import type { FolderServer, FolderServerDTO } from '../entities/FolderServer';

// ============ DTO 定义 ============

/**
 * Repository Server DTO
 */
export interface RepositoryServerDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string | null;
  config: RepositoryConfigServerDTO;
  stats: RepositoryStatsServerDTO;
  status: RepositoryStatus;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms

  // 子实体（可选加载）
  folders?: FolderServerDTO[] | null;
}

/**
 * Repository Persistence DTO (数据库映射)
 * 扁平化结构，直接映射数据库字段
 */
export interface RepositoryPersistenceDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string | null;
  config: string; // JSON string
  stats: string; // JSON string
  status: RepositoryStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // 注意：子实体（folders）在数据库中是独立表，通过外键关联
}

// ============ 实体接口 ============

/**
 * Repository 聚合根 - Server 接口（实例方法）
 */
export interface RepositoryServer {
  // 基础属性
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string | null;
  config: RepositoryConfigServer;
  stats: RepositoryStatsServer;
  status: RepositoryStatus;
  createdAt: Date;
  updatedAt: Date;

  // 子实体
  folders?: FolderServer[] | null;

  // 方法
  updateConfig(newConfig: Partial<RepositoryConfigServer>): void;
  updateStats(newStats: Partial<RepositoryStatsServer>): void;
  archive(): void;
  activate(): void;
  delete(): void;

  // DTO 转换方法
  toServerDTO(includeFolders?: boolean): RepositoryServerDTO;
  toPersistenceDTO(): RepositoryPersistenceDTO;
}

// ============ 静态工厂方法接口 ============

export interface RepositoryServerStatic {
  create(params: {
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string;
    config?: Partial<RepositoryConfigServer>;
  }): RepositoryServer;

  fromServerDTO(dto: RepositoryServerDTO): RepositoryServer;
  fromPersistenceDTO(dto: RepositoryPersistenceDTO): RepositoryServer;
}
