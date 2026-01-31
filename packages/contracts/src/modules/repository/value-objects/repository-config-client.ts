/**
 * Repository Config Value Object - Client
 * 仓储配置值对�?- 客户�?
 */
import type { RepositoryConfigServerDTO } from './repository-config-server';

// ============ Client DTO ============
export interface RepositoryConfigClientDTO {
  searchEngine: 'postgres' | 'meilisearch' | 'elasticsearch';
  enableGit: boolean;
  autoSync?: boolean;
  syncInterval?: number;
  [key: string]: unknown;

  // UI 计算字段
  searchEngineText: string;
  gitStatusText: string;
  syncStatusText: string;
}

// ============ Client 接口 ============
export interface RepositoryConfigClient {
  searchEngine: 'postgres' | 'meilisearch' | 'elasticsearch';
  enableGit: boolean;
  autoSync?: boolean;
  syncInterval?: number;
  [key: string]: unknown;

  // UI 计算属�?
  searchEngineText: string;
  gitStatusText: string;
  syncStatusText: string;
}

// ============ Client Static ============
