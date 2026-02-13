/**
 * IEditorWorkspaceRepository
 * EditorWorkspace 鑱氬悎鏍逛粨鍌ㄦ帴鍙?
 */

import type { EditorWorkspace } from '../aggregates/editor-workspace';

/**
 * EditorWorkspace 浠撳偍鎺ュ彛
 */
export interface IEditorWorkspaceRepository {
  /**
   * 鏍规嵁 UUID 鏌ユ壘宸ヤ綔鍖?
   */
  findById(id: string): Promise<EditorWorkspace | null>;

  /**
   * 鏍规嵁璐︽埛 UUID 鏌ユ壘鎵€鏈夊伐浣滃尯
   */
  findByIdentityId(identityId: string): Promise<EditorWorkspace[]>;

  /**
   * 鏍规嵁璐︽埛 UUID 鍜屽悕绉版煡鎵惧伐浣滃尯
   */
  findByIdentityIdAndName(identityId: string, name: string): Promise<EditorWorkspace | null>;

  /**
   * 鏌ユ壘娲诲姩宸ヤ綔鍖?
   */
  findActiveByIdentityId(identityId: string): Promise<EditorWorkspace | null>;

  /**
   * 淇濆瓨宸ヤ綔鍖?
   */
  save(workspace: EditorWorkspace): Promise<void>;

  /**
   * 鍒犻櫎宸ヤ綔鍖?
   */
  delete(id: string): Promise<void>;

  /**
   * 鎵归噺淇濆瓨宸ヤ綔鍖?
   */
  saveBatch(workspaces: EditorWorkspace[]): Promise<void>;

  /**
   * 鍒ゆ柇宸ヤ綔鍖哄悕绉版槸鍚﹀凡瀛樺湪
   */
  existsByName(identityId: string, name: string): Promise<boolean>;

  /**
   * 缁熻璐︽埛鐨勫伐浣滃尯鏁伴噺
   */
  countByIdentityId(identityId: string): Promise<number>;
}
