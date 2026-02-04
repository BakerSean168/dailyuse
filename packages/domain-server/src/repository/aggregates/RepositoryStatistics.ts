/**
 * RepositoryStatistics - 仓库统计聚合根
 * 
 * 职责：
 * - 存储和管理仓库的统计信息
 * - 计算各类统计指标
 */

import { v4 as uuid } from 'uuid';

// ============ DTO 定义（服务端特有）============

/**
 * RepositoryStatistics Server DTO
 */
export interface RepositoryStatisticsServerDTO {
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
 * RepositoryStatistics Persistence DTO
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

export class RepositoryStatistics {
  readonly uuid: string;
  readonly accountUuid: string;
  
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
  private createdAt: number;
  private updatedAt: number;

  private constructor(props: {
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
  }) {
    this.uuid = props.uuid;
    this.accountUuid = props.accountUuid;
    this.totalRepositories = props.totalRepositories;
    this.activeRepositories = props.activeRepositories;
    this.archivedRepositories = props.archivedRepositories;
    this.totalResources = props.totalResources;
    this.totalFolders = props.totalFolders;
    this.totalTags = props.totalTags;
    this.totalStorageBytes = props.totalStorageBytes;
    this.lastUpdatedAt = props.lastUpdatedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * 创建默认的统计数据
   */
  static createDefault(accountUuid: string): RepositoryStatistics {
    const now = Date.now();
    return new RepositoryStatistics({
      uuid: uuid(),
      accountUuid,
      totalRepositories: 0,
      activeRepositories: 0,
      archivedRepositories: 0,
      totalResources: 0,
      totalFolders: 0,
      totalTags: 0,
      totalStorageBytes: 0,
      lastUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从持久化 DTO 恢复
   */
  static fromPersistence(dto: RepositoryStatisticsPersistenceDTO): RepositoryStatistics {
    return new RepositoryStatistics({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      totalRepositories: dto.totalRepositories,
      activeRepositories: dto.activeRepositories,
      archivedRepositories: dto.archivedRepositories,
      totalResources: dto.totalResources,
      totalFolders: dto.totalFolders,
      totalTags: dto.totalTags,
      totalStorageBytes: dto.totalStorageBytes,
      lastUpdatedAt: dto.lastUpdatedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * 转换为客户端 DTO
   */
  toClientDTO(): RepositoryStatisticsServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      totalRepositories: this.totalRepositories,
      activeRepositories: this.activeRepositories,
      archivedRepositories: this.archivedRepositories,
      totalResources: this.totalResources,
      totalFolders: this.totalFolders,
      totalTags: this.totalTags,
      totalStorageBytes: this.totalStorageBytes,
      lastUpdatedAt: this.lastUpdatedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 转换为持久化 DTO
   */
  toPersistence(): RepositoryStatisticsPersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      totalRepositories: this.totalRepositories,
      activeRepositories: this.activeRepositories,
      archivedRepositories: this.archivedRepositories,
      totalResources: this.totalResources,
      totalFolders: this.totalFolders,
      totalTags: this.totalTags,
      totalStorageBytes: this.totalStorageBytes,
      lastUpdatedAt: this.lastUpdatedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 更新统计数据
   */
  update(data: Partial<{
    totalRepositories: number;
    activeRepositories: number;
    archivedRepositories: number;
    totalResources: number;
    totalFolders: number;
    totalTags: number;
    totalStorageBytes: number;
  }>): void {
    if (data.totalRepositories !== undefined) this.totalRepositories = data.totalRepositories;
    if (data.activeRepositories !== undefined) this.activeRepositories = data.activeRepositories;
    if (data.archivedRepositories !== undefined) this.archivedRepositories = data.archivedRepositories;
    if (data.totalResources !== undefined) this.totalResources = data.totalResources;
    if (data.totalFolders !== undefined) this.totalFolders = data.totalFolders;
    if (data.totalTags !== undefined) this.totalTags = data.totalTags;
    if (data.totalStorageBytes !== undefined) this.totalStorageBytes = data.totalStorageBytes;
    this.lastUpdatedAt = Date.now();
    this.updatedAt = Date.now();
  }
}
