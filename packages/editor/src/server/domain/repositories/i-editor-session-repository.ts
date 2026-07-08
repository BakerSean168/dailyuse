/**
 * IEditorSessionRepository
 * EditorSession 鑱氬悎鏍逛粨鍌ㄦ帴鍙?
 */

import type { EditorSession } from '../entities/editor-session';

/**
 * EditorSession 浠撳偍鎺ュ彛
 */
export interface IEditorSessionRepository {
  /**
   * 鏍规嵁 UUID 鏌ユ壘浼氳瘽
   */
  findById(id: string): Promise<EditorSession | null>;

  /**
   * 鏍规嵁宸ヤ綔鍖?UUID 鏌ユ壘鎵€鏈変細璇?
   */
  findByWorkspaceId(workspaceId: string): Promise<EditorSession[]>;

  /**
   * 鏍规嵁宸ヤ綔鍖?UUID 鍜屽悕绉版煡鎵句細璇?
   */
  findByWorkspaceIdAndName(workspaceId: string, name: string): Promise<EditorSession | null>;

  /**
   * 鏌ユ壘娲诲姩浼氳瘽
   */
  findActiveByWorkspaceId(workspaceId: string): Promise<EditorSession | null>;

  /**
   * 淇濆瓨浼氳瘽
   */
  save(session: EditorSession): Promise<void>;

  /**
   * 鍒犻櫎浼氳瘽
   */
  delete(id: string): Promise<void>;

  /**
   * 鎵归噺淇濆瓨浼氳瘽
   */
  saveBatch(sessions: EditorSession[]): Promise<void>;

  /**
   * 鍒犻櫎宸ヤ綔鍖虹殑鎵€鏈変細璇?
   */
  deleteByWorkspaceId(workspaceId: string): Promise<void>;

  /**
   * 缁熻宸ヤ綔鍖虹殑浼氳瘽鏁伴噺
   */
  countByWorkspaceId(workspaceId: string): Promise<number>;
}
