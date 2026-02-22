/**
 * Repository Aggregate Root - Client Interface
 * 仓储聚合?- 客户端接?
 */
import type { RepositoryId, IdentityId, DomainDate, TransferDate } from '@/primitives';
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
 * Repository Client DTO
 */
export interface RepositoryClientDTO {
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
