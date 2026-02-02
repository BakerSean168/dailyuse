/**
 * Repository Aggregate Root - Server Interface
 * 仓储聚合根 - 服务端接口
 * @path 应该是仓库的物理存储路径，desktop 端可用，web 端为空
 */
import type { RepositoryId, IdentityId, DomainDate, TransferDate, PersistenceDate } from '@/primitives';
import type { RepositoryType } from '../value-objects/repository-type';
import type { RepositoryStatus } from '../value-objects/repository-status';
import type {
  RepositoryConfig,
  RepositoryConfigDTO,
  RepositoryStats,
  RepositoryStatsDTO,
} from '../value-objects';

// ============ 实体接口 ============

/**
 * Repository 聚合根 - Server 接口（实例方法）
 * @path 应该是仓库的物理存储路径，desktop 端可用，web 端为空
 */
export interface RepositoryServer {
  // 基础属性
  id: RepositoryId;
  identityId: IdentityId;
  name: string;
  type: RepositoryType;
  path: string | null;
  description: string | null;
  config: RepositoryConfig;
  stats: RepositoryStats;
  status: RepositoryStatus;
  createdAt: DomainDate;
  updatedAt: DomainDate;
}

// ============ DTO 定义 ============

/**
 * Repository Server DTO
 */
export interface RepositoryServerDTO {
  id: string;
  identityId: string;
  name: string;
  type: RepositoryType;
  path: string | null;
  description: string | null;
  config: RepositoryConfigDTO;
  stats: RepositoryStatsDTO;
  status: RepositoryStatus;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * Repository Persistence DTO (数据库映射)
 * 扁平化结构，直接映射数据库字段
 */
export interface RepositoryPersistenceDTO {
  id: string;
  identityId: string;
  name: string;
  type: RepositoryType;
  path: string | null;
  description: string | null;
  config: string; // JSON string
  stats: string; // JSON string
  status: RepositoryStatus;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  
  // 注意：子实体（folders）在数据库中是独立表，通过外键关联
}


