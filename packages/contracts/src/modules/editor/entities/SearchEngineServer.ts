/**
 * SearchEngine Entity - Server Interface
 * 搜索引擎实体 - 服务端接口
 */

import type { SearchEngineClientDTO } from './SearchEngineClient';

/**
 * Search Engine Server DTO
 * 搜索引擎服务端 DTO
 */
export interface SearchEngineServerDTO {
  uuid: string;
  workspaceUuid: string; // 所属工作区 UUID（聚合根外键）
  accountUuid: string;
  name: string;
  description?: string | null;
  indexPath: string; // 索引存储路径
  indexedDocumentCount: number; // 已索引文档数量
  totalDocumentCount: number; // 总文档数量
  lastIndexedAt?: number | null; // epoch ms
  isIndexing: boolean; // 是否正在索引
  indexProgress?: number | null; // 索引进度（0-100）
  createdAt: number;
  updatedAt: number;
}

/**
 * Search Engine Persistence DTO
 * 搜索引擎持久化 DTO（数据库字段，snake_case）
 */
export interface SearchEnginePersistenceDTO {
  uuid: string;
  workspace_uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  index_path: string;
  indexed_document_count: number;
  total_document_count: number;
  last_indexed_at?: number | null;
  is_indexing: boolean;
  index_progress?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Search Engine Entity - Server Interface
 * 搜索引擎实体 - 服务端接口
 */
export interface SearchEngineServer {
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

  // ===== 业务方法 =====

  /**
   * 开始索引
   */
  startIndexing(totalDocumentCount: number): void;

  /**
   * 更新索引进度
   */
  updateProgress(indexedCount: number, totalCount: number): void;

  /**
   * 完成索引
   */
  completeIndexing(): void;

  /**
   * 取消索引
   */
  cancelIndexing(): void;

  /**
   * 重置索引
   */
  resetIndex(): void;

  /**
   * 增量索引单个文档
   */
  indexDocument(): void;

  /**
   * 判断索引是否完整
   */
  isIndexComplete(): boolean;

  /**
   * 判断索引是否过期（需要重建）
   */
  isIndexOutdated(threshold: number): boolean;

  // ===== DTO 转换方法 =====}
