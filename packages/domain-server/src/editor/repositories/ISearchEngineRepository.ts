/**
 * ISearchEngineRepository
 * SearchEngine 实体仓储接口
 */

import type { SearchEngine } from '../entities/search-engine';

/**
 * SearchEngine 仓储接口
 */
export interface ISearchEngineRepository {
  /**
   * 根据 UUID 查找搜索引擎
   */
  findByUuid(uuid: string): Promise<SearchEngine | null>;

  /**
   * 根据工作区 UUID 查找搜索引擎
   */
  findByWorkspaceUuid(workspaceUuid: string): Promise<SearchEngine | null>;

  /**
   * 查找正在索引的搜索引擎
   */
  findIndexing(): Promise<SearchEngine[]>;

  /**
   * 查找索引过期的搜索引擎（超过指定阈值）
   */
  findOutdated(threshold: number): Promise<SearchEngine[]>;

  /**
   * 保存搜索引擎
   */
  save(engine: SearchEngine): Promise<void>;

  /**
   * 删除搜索引擎
   */
  delete(uuid: string): Promise<void>;

  /**
   * 删除工作区的搜索引擎
   */
  deleteByWorkspaceUuid(workspaceUuid: string): Promise<void>;

  /**
   * 判断工作区是否已有搜索引擎
   */
  existsByWorkspaceUuid(workspaceUuid: string): Promise<boolean>;

  /**
   * 统计正在索引的搜索引擎数量
   */
  countIndexing(): Promise<number>;
}
