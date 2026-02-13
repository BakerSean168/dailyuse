/**
 * IDocumentRepository
 * Document 瀹炰綋浠撳偍鎺ュ彛
 */

import type { Document } from '../entities/document';
import type { IndexStatus } from '@dailyuse/contracts/editor';

/**
 * Document 浠撳偍鎺ュ彛
 */
export interface IDocumentRepository {
  /**
   * 鏍规嵁 UUID 鏌ユ壘鏂囨。
   */
  findById(id: string): Promise<Document | null>;

  /**
   * 鏍规嵁宸ヤ綔鍖?UUID 鏌ユ壘鎵€鏈夋枃妗?
   */
  findByWorkspaceId(workspaceId: string): Promise<Document[]>;

  /**
   * 鏍规嵁璺緞鏌ユ壘鏂囨。
   */
  findByPath(workspaceId: string, path: string): Promise<Document | null>;

  /**
   * 鏍规嵁鍐呭鍝堝笇鏌ユ壘鏂囨。
   */
  findByContentHash(contentHash: string): Promise<Document[]>;

  /**
   * 鏌ユ壘闇€瑕佺储寮曠殑鏂囨。锛堢储寮曠姸鎬佷负 OUTDATED 鎴?FAILED锛?
   */
  findDocumentsNeedingIndex(workspaceId: string): Promise<Document[]>;

  /**
   * 鏍规嵁绱㈠紩鐘舵€佹煡鎵炬枃妗?
   */
  findByIndexStatus(workspaceId: string, status: IndexStatus): Promise<Document[]>;

  /**
   * 鏌ユ壘鏈€杩戜慨鏀圭殑鏂囨。
   */
  findRecentlyModified(workspaceId: string, limit: number): Promise<Document[]>;

  /**
   * 淇濆瓨鏂囨。
   */
  save(document: Document): Promise<void>;

  /**
   * 鍒犻櫎鏂囨。
   */
  delete(id: string): Promise<void>;

  /**
   * 鎵归噺淇濆瓨鏂囨。
   */
  saveBatch(documents: Document[]): Promise<void>;

  /**
   * 鍒犻櫎宸ヤ綔鍖虹殑鎵€鏈夋枃妗?
   */
  deleteByWorkspaceId(workspaceId: string): Promise<void>;

  /**
   * 缁熻宸ヤ綔鍖虹殑鏂囨。鏁伴噺
   */
  countByWorkspaceId(workspaceId: string): Promise<number>;

  /**
   * 缁熻闇€瑕佺储寮曠殑鏂囨。鏁伴噺
   */
  countDocumentsNeedingIndex(workspaceId: string): Promise<number>;
}
