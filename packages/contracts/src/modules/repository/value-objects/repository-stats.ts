/**
 * Repository Stats Value Object
 * 仓储统计值对象
 */

// ============ DTO 定义 ============

/**
 * Repository Stats DTO (Server)
 */
export interface RepositoryStatsDTO {
  resourceCount: number;
  folderCount: number;
  totalSize: number;
}

/**
 * Repository Stats Client DTO
 * 包含 UI 计算字段
 */
export interface RepositoryStatsClientDTO {
  resourceCount: number;
  folderCount: number;
  totalSize: number;

  // UI 计算字段
  formattedSize: string;
  hasResources: boolean;
  hasFolders: boolean;
}

// ============ 实体接口 ============

/**
 * Repository Stats 值对象接口
 */
export interface RepositoryStats {
  resourceCount: number;
  folderCount: number;
  totalSize: number;
}

/**
 * Repository Stats Client 值对象接口
 * 包含 UI 计算属性
 */
export interface RepositoryStatsClient {
  resourceCount: number;
  folderCount: number;
  totalSize: number;

  // UI 计算属性
  formattedSize: string;
  hasResources: boolean;
  hasFolders: boolean;
}
