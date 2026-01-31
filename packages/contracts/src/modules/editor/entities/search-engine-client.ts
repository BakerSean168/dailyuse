/**
 * SearchEngine Entity - Client Interface
 * 搜索引擎实体 - 客户端接�?
 */

import type { SearchEngineId, EditorWorkspaceId, IdentityId, TransferDate, DomainDate } from '@/primitives';
import type { SearchEngineServerDTO } from './search-engine-server';

/**
 * Search Engine Client DTO
 * 搜索引擎客户�?DTO（包�?UI 格式化字段）
 */
export interface SearchEngineClientDTO {
  id: string;
  workspaceId: string;
  identityId: string;
  name: string;
  description: string | null;
  indexPath: string;
  indexedDocumentCount: number;
  totalDocumentCount: number;
  lastIndexedAt: TransferDate | null;
  isIndexing: boolean;
  indexProgress: number | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI 格式化字�?
  formattedLastIndexed: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

/**
 * Search Engine Entity - Client Interface
 * 搜索引擎实体 - 客户端接�?
 */
export interface SearchEngineClient {
  // ===== 基础属�?=====
  readonly id: SearchEngineId;
  readonly workspaceId: EditorWorkspaceId;
  readonly identityId: IdentityId;
  readonly name: string;
  readonly description: string | null;
  readonly indexPath: string;
  readonly indexedDocumentCount: number;
  readonly totalDocumentCount: number;
  readonly lastIndexedAt: DomainDate | null;
  readonly isIndexing: boolean;
  readonly indexProgress: number | null;
  readonly createdAt: DomainDate;
  readonly updatedAt: DomainDate;

  // ===== UI 辅助方法 =====

  /**
   * 获取索引状态标�?
   */
  getIndexStatusLabel(): string;

  /**
   * 获取索引状态颜�?
   */
  getIndexStatusColor(): string;

  /**
   * 获取索引进度百分比文本（�?"50%"�?
   */
  getProgressText(): string;

  /**
   * 是否索引完整
   */
  isIndexComplete(): boolean;

  /**
   * 获取完成率（0-1�?
   */
  getCompletionRate(): number;

  /**
   * 获取格式化的最后索引时�?
   */
  getFormattedLastIndexed(): string | null;

  /**
   * 是否需要重新索�?
   */
  needsReindex(): boolean;

  // ===== DTO 转换方法 =====
}
