/**
 * Repository Aggregate Root - Server Interface
 * 仓储聚合根 - 服务端接口
 * @path 应该是仓库的物理存储路径，desktop 端可用，web 端为空
 * 
 * 【同步支持】
 * - deletedAt: 软删除时间戳
 * - version: 乐观锁版本号
 * - updatedAt: 最后更新时间（增量同步）
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

  // 同步字段
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
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
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
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
  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
  
  // 注意：子实体（folders）在数据库中是独立表，通过外键关联
}


