/**
 * IEditorTabRepository
 * EditorTab 实体仓储接口
 */

import type { EditorTab } from '../entities/editor-tab';

/**
 * EditorTab 仓储接口
 */
export interface IEditorTabRepository {
  /**
   * 根据 UUID 查找标签
   */
  findByUuid(uuid: string): Promise<EditorTab | null>;

  /**
   * 根据分组 UUID 查找所有标签
   */
  findByGroupUuid(groupUuid: string): Promise<EditorTab[]>;

  /**
   * 根据文档 UUID 查找所有标签
   */
  findByDocumentUuid(documentUuid: string): Promise<EditorTab[]>;

  /**
   * 根据分组 UUID 和标签索引查找标签
   */
  findByGroupUuidAndTabIndex(groupUuid: string, tabIndex: number): Promise<EditorTab | null>;

  /**
   * 查找固定的标签
   */
  findPinnedByGroupUuid(groupUuid: string): Promise<EditorTab[]>;

  /**
   * 查找脏标签（未保存的）
   */
  findDirtyByGroupUuid(groupUuid: string): Promise<EditorTab[]>;

  /**
   * 查找最近访问的标签
   */
  findRecentlyAccessed(groupUuid: string, limit: number): Promise<EditorTab[]>;

  /**
   * 保存标签
   */
  save(tab: EditorTab): Promise<void>;

  /**
   * 删除标签
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量保存标签
   */
  saveBatch(tabs: EditorTab[]): Promise<void>;

  /**
   * 删除分组的所有标签
   */
  deleteByGroupUuid(groupUuid: string): Promise<void>;

  /**
   * 删除文档的所有标签
   */
  deleteByDocumentUuid(documentUuid: string): Promise<void>;

  /**
   * 统计分组的标签数量
   */
  countByGroupUuid(groupUuid: string): Promise<number>;

  /**
   * 统计脏标签数量
   */
  countDirtyByGroupUuid(groupUuid: string): Promise<number>;

  /**
   * 获取分组的最大标签索引
   */
  getMaxTabIndex(groupUuid: string): Promise<number>;
}
