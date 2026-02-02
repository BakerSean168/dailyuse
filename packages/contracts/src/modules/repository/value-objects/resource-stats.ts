/**
 * Resource Stats Value Object
 * 资源统计值对象
 */

// ============ DTO 定义 ============

/**
 * Resource Stats DTO
 */
export interface ResourceStatsDTO {
  viewCount: number;
  editCount: number;
  linkCount: number;
  lastViewedAt: number | null; // epoch ms
  lastEditedAt: number | null; // epoch ms
}

/**
 * Resource Stats Persistence DTO (数据库映射)
 */
export interface ResourceStatsPersistenceDTO {
  viewCount: number;
  editCount: number;
  linkCount: number;
  lastViewedAt: number | null;
  lastEditedAt: number | null;
}

// ============ 实体接口 ============

/**
 * Resource Stats 值对象接口
 */
export interface ResourceStats {
  viewCount: number;
  editCount: number;
  linkCount: number;
  lastViewedAt: number | null;
  lastEditedAt: number | null;
}
  lastViewedText: string | null;
  lastEditedText: string | null;
}
