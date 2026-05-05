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
 * Repository Config DTO
 */
export interface RepositoryConfigDTO {
  searchEngine: RepositorySearchEngine;
  enableGit: boolean;
  autoSync?: boolean;
  syncInterval?: number;
  [key: string]: unknown;
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
