/**
 * Resource Stats Value Object - Client
 * 资源统计值对象 - 客户端
 */
import type { ResourceStatsServerDTO } from './ResourceStatsServer';

// ============ Client DTO ============
export interface ResourceStatsClientDTO {
  viewCount: number;
  editCount: number;
  linkCount: number;
  lastViewedAt?: number | null;
  lastEditedAt?: number | null;

  // UI 计算字段
  viewCountText: string; // "浏览 123 次"
  editCountText: string; // "编辑 45 次"
  linkCountText: string; // "6 个链接"
  lastViewedText?: string | null; // "3 小时前"
  lastEditedText?: string | null; // "2 天前"
}

// ============ Client 接口 ============
export interface ResourceStatsClient {
  viewCount: number;
  editCount: number;
  linkCount: number;
  lastViewedAt?: number | null;
  lastEditedAt?: number | null;

  // UI 计算属性
  viewCountText: string;
  editCountText: string;
  linkCountText: string;
  lastViewedText?: string | null;
  lastEditedText?: string | null;}

// ============ Client Static ============
