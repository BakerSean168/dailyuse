/**
 * Repository Stats Value Object - Server
 * 仓储统计值对�?- 服务�?
 */

// ============ Server DTO ============
export interface RepositoryStatsServerDTO {
  resourceCount: number;
  folderCount: number;
  totalSize: number;
}

// ============ Server 接口 ============
export interface RepositoryStatsServer {
  resourceCount: number;
  folderCount: number;
  totalSize: number;
}

// ============ Server Static ============
