/**
 * SearchEngine Entity - Client Interface
 * 搜索引擎实体 - 客户端接口
 */

import type { SearchEngineServerDTO } from './SearchEngineServer';

/**
 * Search Engine Client DTO
 * 搜索引擎客户端 DTO（包含 UI 格式化字段）
 */
export interface SearchEngineClientDTO {
  uuid: string;
  workspaceUuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  indexPath: string;
  indexedDocumentCount: number;
  totalDocumentCount: number;
  lastIndexedAt?: number | null;
  isIndexing: boolean;
  indexProgress?: number | null;
  createdAt: number;
  updatedAt: number;

  // UI 格式化字段
  formattedLastIndexed?: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

/**
 * Search Engine Entity - Client Interface
 * 搜索引擎实体 - 客户端接口
 */
export interface SearchEngineClient {
  // ===== 基础属性 =====
  readonly uuid: string;
  readonly workspaceUuid: string;
  readonly accountUuid: string;
  readonly name: string;
  readonly description?: string | null;
  readonly indexPath: string;
  readonly indexedDocumentCount: number;
  readonly totalDocumentCount: number;
  readonly lastIndexedAt?: number | null;
  readonly isIndexing: boolean;
  readonly indexProgress?: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // ===== UI 辅助方法 =====

  /**
   * 获取索引状态标签
   */
  getIndexStatusLabel(): string;

  /**
   * 获取索引状态颜色
   */
  getIndexStatusColor(): string;

  /**
   * 获取索引进度百分比文本（如 "50%"）
   */
  getProgressText(): string;

  /**
   * 是否索引完整
   */
  isIndexComplete(): boolean;

  /**
   * 获取完成率（0-1）
   */
  getCompletionRate(): number;

  /**
   * 获取格式化的最后索引时间
   */
  getFormattedLastIndexed(): string | null;

  /**
   * 是否需要重新索引
   */
  needsReindex(): boolean;

  // ===== DTO 转换方法 =====}
