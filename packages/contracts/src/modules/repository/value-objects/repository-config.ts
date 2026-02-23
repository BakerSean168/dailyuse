/**
 * Repository Config Value Object
 * 仓储配置值对象
 */

// ============ DTO 定义 ============
export const RepositorySearchEngine = {
  Postgres: 'postgres',
  Meilisearch: 'meilisearch',
  Elasticsearch: 'elasticsearch',
} as const;

export type RepositorySearchEngine =
  (typeof RepositorySearchEngine)[keyof typeof RepositorySearchEngine];

/**
 * Repository Config DTO (Server)
 */
export interface RepositoryConfigDTO {
  searchEngine: RepositorySearchEngine;
  enableGit: boolean;
  autoSync?: boolean;
  syncInterval?: number;
  [key: string]: unknown;
}

/**
 * Repository Config Client DTO
 * 包含 UI 计算字段
 */
export interface RepositoryConfigClientDTO {
  searchEngine: RepositorySearchEngine;
  enableGit: boolean;
  autoSync?: boolean;
  syncInterval?: number;
  [key: string]: unknown;

  // UI 计算字段
  searchEngineText: string;
  gitStatusText: string;
  syncStatusText: string;
}

// ============ 实体接口 ============

/**
 * Repository Config 值对象接口
 */
export interface RepositoryConfig {
  searchEngine: RepositorySearchEngine;
  enableGit: boolean;
  autoSync?: boolean;
  syncInterval?: number;
}

/**
 * Repository Config Client 值对象接口
 * 包含 UI 计算属性
 */
export interface RepositoryConfigClient {
  searchEngine: RepositorySearchEngine;
  enableGit: boolean;
  autoSync?: boolean;
  syncInterval?: number;

  // UI 计算属性
  searchEngineText: string;
  gitStatusText: string;
  syncStatusText: string;
}
