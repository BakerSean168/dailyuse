/**
 * Repository Stats Value Object
 * 仓储统计值对象
 */

// ============ DTO 定义 ============

/**
 * Repository Stats DTO
 */
export interface RepositoryStatsDTO {
  resourceCount: number;
  folderCount: number;
  totalSize: number;
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
