/**
 * Repository Config Value Object - Server
 * 仓储配置值对象 - 服务端
 */

// ============ Server DTO ============
export interface RepositoryConfigServerDTO {
  searchEngine: 'postgres' | 'meilisearch' | 'elasticsearch';
  enableGit: boolean;
  autoSync?: boolean;
  syncInterval?: number;
  [key: string]: unknown;
}

// ============ Server 接口 ============
export interface RepositoryConfigServer {
  searchEngine: 'postgres' | 'meilisearch' | 'elasticsearch';
  enableGit: boolean;
  autoSync?: boolean;
  syncInterval?: number;
  [key: string]: unknown;}

// ============ Server Static ============
