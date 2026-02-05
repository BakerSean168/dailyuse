/**
 * IEditorSessionRepository
 * EditorSession 聚合根仓储接口
 */

import type { EditorSession } from '../entities/editor-session';

/**
 * EditorSession 仓储接口
 */
export interface IEditorSessionRepository {
  /**
   * 根据 UUID 查找会话
   */
  findByUuid(uuid: string): Promise<EditorSession | null>;

  /**
   * 根据工作区 UUID 查找所有会话
   */
  findByWorkspaceUuid(workspaceUuid: string): Promise<EditorSession[]>;

  /**
   * 根据工作区 UUID 和名称查找会话
   */
  findByWorkspaceUuidAndName(workspaceUuid: string, name: string): Promise<EditorSession | null>;

  /**
   * 查找活动会话
   */
  findActiveByWorkspaceUuid(workspaceUuid: string): Promise<EditorSession | null>;

  /**
   * 保存会话
   */
  save(session: EditorSession): Promise<void>;

  /**
   * 删除会话
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量保存会话
   */
  saveBatch(sessions: EditorSession[]): Promise<void>;

  /**
   * 删除工作区的所有会话
   */
  deleteByWorkspaceUuid(workspaceUuid: string): Promise<void>;

  /**
   * 统计工作区的会话数量
   */
  countByWorkspaceUuid(workspaceUuid: string): Promise<number>;
}
