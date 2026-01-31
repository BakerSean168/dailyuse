/**
 * Resource Stats Value Object - Client
 * 资源统计值对�?- 客户�?
 */
import type { ResourceStatsServerDTO } from './resource-stats-server';

// ============ Client DTO ============
export interface ResourceStatsClientDTO {
  viewCount: number;
  editCount: number;
  linkCount: number;
  lastViewedAt: number | null;
  lastEditedAt: number | null;

  // UI 计算字段
  viewCountText: string; // "浏览 123 �?
  editCountText: string; // "编辑 45 �?
  linkCountText: string; // "6 个链�?
  lastViewedText: string | null; // "3 小时�?
  lastEditedText: string | null; // "2 天前"
}

// ============ Client 接口 ============
export interface ResourceStatsClient {
  viewCount: number;
  editCount: number;
  linkCount: number;
  lastViewedAt: number | null;
  lastEditedAt: number | null;

  // UI 计算属�?
  viewCountText: string;
  editCountText: string;
  linkCountText: string;
  lastViewedText: string | null;
  lastEditedText: string | null;
}

// ============ Client Static ============
