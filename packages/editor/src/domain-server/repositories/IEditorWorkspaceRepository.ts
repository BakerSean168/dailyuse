/**
 * IEditorWorkspaceRepository
 * EditorWorkspace 聚合根仓储接口
 */

import type { EditorWorkspace } from '../aggregates/editor-workspace';

/**
 * EditorWorkspace 仓储接口
 */
export interface IEditorWorkspaceRepository {
  /**
   * 根据 UUID 查找工作区
   */
  findByUuid(uuid: string): Promise<EditorWorkspace | null>;

  /**
   * 根据账户 UUID 查找所有工作区
   */
  findByAccountUuid(accountUuid: string): Promise<EditorWorkspace[]>;

  /**
   * 根据账户 UUID 和名称查找工作区
   */
  findByAccountUuidAndName(accountUuid: string, name: string): Promise<EditorWorkspace | null>;

  /**
   * 查找活动工作区
   */
  findActiveByAccountUuid(accountUuid: string): Promise<EditorWorkspace | null>;

  /**
   * 保存工作区
   */
  save(workspace: EditorWorkspace): Promise<void>;

  /**
   * 删除工作区
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量保存工作区
   */
  saveBatch(workspaces: EditorWorkspace[]): Promise<void>;

  /**
   * 判断工作区名称是否已存在
   */
  existsByName(accountUuid: string, name: string): Promise<boolean>;

  /**
   * 统计账户的工作区数量
   */
  countByAccountUuid(accountUuid: string): Promise<number>;
}
