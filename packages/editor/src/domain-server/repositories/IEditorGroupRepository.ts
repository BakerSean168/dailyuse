/**
 * IEditorGroupRepository
 * EditorGroup 瀹炰綋浠撳偍鎺ュ彛
 */

import type { EditorGroup } from '../entities/editor-group';

/**
 * EditorGroup 浠撳偍鎺ュ彛
 */
export interface IEditorGroupRepository {
  /**
   * 鏍规嵁 UUID 鏌ユ壘鍒嗙粍
   */
  findById(id: string): Promise<EditorGroup | null>;

  /**
   * 鏍规嵁浼氳瘽 UUID 鏌ユ壘鎵€鏈夊垎缁?
   */
  findBySessionId(sessionId: string): Promise<EditorGroup[]>;

  /**
   * 鏍规嵁浼氳瘽 UUID 鍜屽垎缁勭储寮曟煡鎵惧垎缁?
   */
  findBySessionIdAndGroupIndex(
    sessionId: string,
    groupIndex: number,
  ): Promise<EditorGroup | null>;

  /**
   * 淇濆瓨鍒嗙粍
   */
  save(group: EditorGroup): Promise<void>;

  /**
   * 鍒犻櫎鍒嗙粍
   */
  delete(id: string): Promise<void>;

  /**
   * 鎵归噺淇濆瓨鍒嗙粍
   */
  saveBatch(groups: EditorGroup[]): Promise<void>;

  /**
   * 鍒犻櫎浼氳瘽鐨勬墍鏈夊垎缁?
   */
  deleteBySessionId(sessionId: string): Promise<void>;

  /**
   * 缁熻浼氳瘽鐨勫垎缁勬暟閲?
   */
  countBySessionId(sessionId: string): Promise<number>;

  /**
   * 鑾峰彇浼氳瘽鐨勬渶澶у垎缁勭储寮?
   */
  getMaxGroupIndex(sessionId: string): Promise<number>;
}
