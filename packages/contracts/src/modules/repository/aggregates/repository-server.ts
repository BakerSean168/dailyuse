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
import type {
  RepositoryId,
  IdentityId,
  DomainDate,
  TransferDate,
} from '../../../primitives';
import type { RepositoryType } from '../value-objects/repository-type';
import type { RepositoryStatus } from '../value-objects/repository-status';
import type {
  RepositoryConfig,
  RepositoryConfigDTO,
  RepositoryStats,
  RepositoryStatsDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * Repository Server DTO
 */
export interface RepositoryServerDTO {
  id: RepositoryId;
  identityId: IdentityId;
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

