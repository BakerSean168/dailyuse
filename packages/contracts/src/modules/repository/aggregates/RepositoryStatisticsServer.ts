/**
 * Repository Statistics Server DTO
 * 仓储统计服务端 DTO
 */

/**
 * 仓储统计服务端 DTO
 */
export interface RepositoryStatisticsServerDTO {
  uuid: string;
  accountUuid: string;
  
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
  
  // 时间戳
  lastUpdatedAt: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * 仓储统计持久化 DTO
 */
export interface RepositoryStatisticsPersistenceDTO {
  uuid: string;
  accountUuid: string;
  totalRepositories: number;
  activeRepositories: number;
  archivedRepositories: number;
  totalResources: number;
  totalFolders: number;
  totalTags: number;
  totalStorageBytes: number;
  lastUpdatedAt: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * 重新计算统计请求
 */
export interface RecalculateStatisticsRequest {
  accountUuid: string;
  force?: boolean;
}

/**
 * 重新计算统计响应
 */
export interface RecalculateStatisticsResponse {
  ok: boolean;
  statistics: RepositoryStatisticsServerDTO;
  recalculatedAt: number;
  message?: string;
}

/**
 * 统计更新事件
 */
export interface StatisticsUpdateEvent {
  type: 'repository.created' | 'repository.deleted' | 'repository.updated' | 'resource.created' | 'resource.deleted' | 'folder.created' | 'folder.deleted';
  accountUuid: string;
  timestamp: number;
  payload?: Record<string, unknown>;
}

/**
 * Repository Statistics Server 静态接口
 */
export interface RepositoryStatisticsServerStatic {
  fromPersistenceDTO(dto: RepositoryStatisticsPersistenceDTO): RepositoryStatisticsServer;
  create(accountUuid: string): RepositoryStatisticsServer;
}

/**
 * Repository Statistics Server 接口
 */
export interface RepositoryStatisticsServer {
  readonly uuid: string;
  readonly accountUuid: string;
  
  // 统计数据
  totalRepositories: number;
  activeRepositories: number;
  archivedRepositories: number;
  totalResources: number;
  totalFolders: number;
  totalTags: number;
  totalStorageBytes: number;
  
  // 时间戳
  lastUpdatedAt: number;
  readonly createdAt: number;
  updatedAt: number;
  
  // 方法
  toClientDTO(): RepositoryStatisticsServerDTO;
  toPersistenceDTO(): RepositoryStatisticsPersistenceDTO;
  
  // 更新方法
  incrementRepositories(delta?: number): void;
  decrementRepositories(delta?: number): void;
  incrementResources(delta?: number): void;
  decrementResources(delta?: number): void;
  incrementFolders(delta?: number): void;
  decrementFolders(delta?: number): void;
  updateStorage(bytes: number): void;
}
