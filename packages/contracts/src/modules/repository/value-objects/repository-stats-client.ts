/**
 * Repository Stats Value Object - Client
 * 仓储统计值对�?- 客户�?
 */
import type { RepositoryStatsServerDTO } from './repository-stats-server';

// ============ Client DTO ============
export interface RepositoryStatsClientDTO {
  resourceCount: number;
  folderCount: number;
  totalSize: number;

  // UI 计算字段
  formattedSize: string;
  hasResources: boolean;
  hasFolders: boolean;
}

// ============ Client 接口 ============
export interface RepositoryStatsClient {
  resourceCount: number;
  folderCount: number;
  totalSize: number;

  // UI 计算属�?
  formattedSize: string;
  hasResources: boolean;
  hasFolders: boolean;
}

// ============ Client Static ============
