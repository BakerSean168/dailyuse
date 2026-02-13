/**
 * ISearchEngineRepository
 * SearchEngine 瀹炰綋浠撳偍鎺ュ彛
 */

import type { SearchEngine } from '../entities/search-engine';

/**
 * SearchEngine 浠撳偍鎺ュ彛
 */
export interface ISearchEngineRepository {
  /**
   * 鏍规嵁 UUID 鏌ユ壘鎼滅储寮曟搸
   */
  findById(id: string): Promise<SearchEngine | null>;

  /**
   * 鏍规嵁宸ヤ綔鍖?UUID 鏌ユ壘鎼滅储寮曟搸
   */
  findByWorkspaceId(workspaceId: string): Promise<SearchEngine | null>;

  /**
   * 鏌ユ壘姝ｅ湪绱㈠紩鐨勬悳绱㈠紩鎿?
   */
  findIndexing(): Promise<SearchEngine[]>;

  /**
   * 鏌ユ壘绱㈠紩杩囨湡鐨勬悳绱㈠紩鎿庯紙瓒呰繃鎸囧畾闃堝€硷級
   */
  findOutdated(threshold: number): Promise<SearchEngine[]>;

  /**
   * 淇濆瓨鎼滅储寮曟搸
   */
  save(engine: SearchEngine): Promise<void>;

  /**
   * 鍒犻櫎鎼滅储寮曟搸
   */
  delete(id: string): Promise<void>;

  /**
   * 鍒犻櫎宸ヤ綔鍖虹殑鎼滅储寮曟搸
   */
  deleteByWorkspaceId(workspaceId: string): Promise<void>;

  /**
   * 鍒ゆ柇宸ヤ綔鍖烘槸鍚﹀凡鏈夋悳绱㈠紩鎿?
   */
  existsByWorkspaceId(workspaceId: string): Promise<boolean>;

  /**
   * 缁熻姝ｅ湪绱㈠紩鐨勬悳绱㈠紩鎿庢暟閲?
   */
  countIndexing(): Promise<number>;
}
