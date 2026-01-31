/**
 * Resource Stats Value Object - Server
 * 资源统计值对�?- 服务�?
 */

// ============ Server DTO ============
export interface ResourceStatsServerDTO {
  viewCount: number;
  editCount: number;
  linkCount: number;
  lastViewedAt: number | null; // epoch ms
  lastEditedAt: number | null; // epoch ms
}

// ============ Server 接口 ============
export interface ResourceStatsServer {
  viewCount: number;
  editCount: number;
  linkCount: number;
  lastViewedAt: number | null;
  lastEditedAt: number | null;
}

// ============ Server Static ============
