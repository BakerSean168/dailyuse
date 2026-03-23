/**
 * IEditorTabRepository
 * EditorTab 瀹炰綋浠撳偍鎺ュ彛
 */

import type { EditorTab } from '../entities/editor-tab';

/**
 * EditorTab 浠撳偍鎺ュ彛
 */
export interface IEditorTabRepository {
  /**
   * 鏍规嵁 UUID 鏌ユ壘鏍囩
   */
  findById(id: string): Promise<EditorTab | null>;

  /**
   * 鏍规嵁鍒嗙粍 UUID 鏌ユ壘鎵€鏈夋爣绛?
   */
  findByGroupId(groupId: string): Promise<EditorTab[]>;

  /**
   * 鏍规嵁鏂囨。 UUID 鏌ユ壘鎵€鏈夋爣绛?
   */
  findByResourceId(resourceId: string): Promise<EditorTab[]>;

  /**
   * 鏍规嵁鍒嗙粍 UUID 鍜屾爣绛剧储寮曟煡鎵炬爣绛?
   */
  findByGroupIdAndTabIndex(groupId: string, tabIndex: number): Promise<EditorTab | null>;

  /**
   * 鏌ユ壘鍥哄畾鐨勬爣绛?
   */
  findPinnedByGroupId(groupId: string): Promise<EditorTab[]>;

  /**
   * 鏌ユ壘鑴忔爣绛撅紙鏈繚瀛樼殑锛?
   */
  findDirtyByGroupId(groupId: string): Promise<EditorTab[]>;

  /**
   * 鏌ユ壘鏈€杩戣闂殑鏍囩
   */
  findRecentlyAccessed(groupId: string, limit: number): Promise<EditorTab[]>;

  /**
   * 淇濆瓨鏍囩
   */
  save(tab: EditorTab): Promise<void>;

  /**
   * 鍒犻櫎鏍囩
   */
  delete(id: string): Promise<void>;

  /**
   * 鎵归噺淇濆瓨鏍囩
   */
  saveBatch(tabs: EditorTab[]): Promise<void>;

  /**
   * 鍒犻櫎鍒嗙粍鐨勬墍鏈夋爣绛?
   */
  deleteByGroupId(groupId: string): Promise<void>;

  /**
   * 鍒犻櫎鏂囨。鐨勬墍鏈夋爣绛?
   */
  deleteByResourceId(resourceId: string): Promise<void>;

  /**
   * 缁熻鍒嗙粍鐨勬爣绛炬暟閲?
   */
  countByGroupId(groupId: string): Promise<number>;

  /**
   * 缁熻鑴忔爣绛炬暟閲?
   */
  countDirtyByGroupId(groupId: string): Promise<number>;

  /**
   * 鑾峰彇鍒嗙粍鐨勬渶澶ф爣绛剧储寮?
   */
  getMaxTabIndex(groupId: string): Promise<number>;
}
