/**
 * Resource Stats Value Object
 * 资源统计值对象
 */

// ============ DTO 定义 ============

/**
 * Resource Stats DTO (Server)
 */
export interface ResourceStatsDTO {
  viewCount: number;
  editCount: number;
  linkCount: number;
  lastViewedAt: number | null; // epoch ms
  lastEditedAt: number | null; // epoch ms
}

/**
 * Resource Stats Client DTO
 * 包含 UI 计算字段
 */
export interface ResourceStatsClientDTO {
  viewCount: number;
  editCount: number;
  linkCount: number;
  lastViewedAt: number | null;
  lastEditedAt: number | null;

  // UI 计算字段
  viewCountText: string; // "浏览 123 次"
  editCountText: string; // "编辑 45 次"
  linkCountText: string; // "6 个链接"
  lastViewedText: string | null; // "3 小时前"
  lastEditedText: string | null; // "2 天前"
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

/**
 * Resource Stats Client 值对象接口
 * 包含 UI 计算属性
 */
export interface ResourceStatsClient {
  viewCount: number;
  editCount: number;
  linkCount: number;
  lastViewedAt: number | null;
  lastEditedAt: number | null;

  // UI 计算属性
  viewCountText: string;
  editCountText: string;
  linkCountText: string;
  lastViewedText: string | null;
  lastEditedText: string | null;
}

// ============ Backward Compatibility ============

/**
 * @deprecated Use ResourceStatsDTO instead
 */
export type ResourceStatsServerDTO = ResourceStatsDTO;

/**
 * @deprecated Use ResourceStats instead
 */
export type ResourceStatsServer = ResourceStats;
