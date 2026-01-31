/**
 * Repository Stats Value Object - Server
 * 仓储统计值对象 - 服务端
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
  totalSize: number;}

// ============ Server Static ============
