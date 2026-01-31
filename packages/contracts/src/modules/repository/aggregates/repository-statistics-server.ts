/**
 * Repository Statistics Server DTO
 * 仓储统计服务�?DTO
 */
import type { RepositoryId, IdentityId, DomainDate, TransferDate, PersistenceDate } from '@/primitives';

/**
 * 仓储统计服务�?DTO
 */
export interface RepositoryStatisticsServerDTO {
  id: string;
  identityId: string;
  
  // 仓储统计
  totalRepositories: number;
  activeRepositories: number;
  archivedRepositories: number;
  
  // 资源统计
  totalResources: number;
  totalFolders: number;
  totalTags: number;
  
  // 存储统计
  totalStorageBytes: number;
  
  // 时间�?
  lastUpdatedAt: TransferDate;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * 仓储统计持久�?DTO
 */
export interface RepositoryStatisticsPersistenceDTO {
  id: string;
  identityId: string;
  totalRepositories: number;
  activeRepositories: number;
  archivedRepositories: number;
  totalResources: number;
  totalFolders: number;
  totalTags: number;
  totalStorageBytes: number;
  lastUpdatedAt: PersistenceDate;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

/**
 * 重新计算统计请求
 */
export interface RecalculateStatisticsRequest {
  identityId: string;
  force?: boolean;
}

/**
 * 重新计算统计响应
 */
export interface RecalculateStatisticsResponse {
  ok: boolean;
  statistics: RepositoryStatisticsServerDTO;
  recalculatedAt: TransferDate;
  message?: string;
}

/**
 * 统计更新事件
 */
export interface StatisticsUpdateEvent {
  type: 'repository.created' | 'repository.deleted' | 'repository.updated' | 'resource.created' | 'resource.deleted' | 'folder.created' | 'folder.deleted';
  identityId: string;
  timestamp: DomainDate;
  payload?: Record<string, unknown>;
}

/**
 * Repository Statistics Server 静态接�?
 */
/**
 * Repository Statistics Server 接口
 */
export interface RepositoryStatisticsServer {
  readonly id: RepositoryId;
  readonly identityId: IdentityId;
  
  // 统计数据
  totalRepositories: number;
  activeRepositories: number;
  archivedRepositories: number;
  totalResources: number;
  totalFolders: number;
  totalTags: number;
  totalStorageBytes: number;
  
  // 时间�?
  lastUpdatedAt: DomainDate;
  readonly createdAt: DomainDate;
  updatedAt: DomainDate;
}
