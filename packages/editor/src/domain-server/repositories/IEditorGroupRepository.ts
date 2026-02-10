/**
 * IEditorGroupRepository
 * EditorGroup 实体仓储接口
 */

import type { EditorGroup } from '../entities/editor-group';

/**
 * EditorGroup 仓储接口
 */
export interface IEditorGroupRepository {
  /**
   * 根据 UUID 查找分组
   */
  findByUuid(uuid: string): Promise<EditorGroup | null>;

  /**
   * 根据会话 UUID 查找所有分组
   */
  findBySessionUuid(sessionUuid: string): Promise<EditorGroup[]>;

  /**
   * 根据会话 UUID 和分组索引查找分组
   */
  findBySessionUuidAndGroupIndex(
    sessionUuid: string,
    groupIndex: number,
  ): Promise<EditorGroup | null>;

  /**
   * 保存分组
   */
  save(group: EditorGroup): Promise<void>;

  /**
   * 删除分组
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量保存分组
   */
  saveBatch(groups: EditorGroup[]): Promise<void>;

  /**
   * 删除会话的所有分组
   */
  deleteBySessionUuid(sessionUuid: string): Promise<void>;

  /**
   * 统计会话的分组数量
   */
  countBySessionUuid(sessionUuid: string): Promise<number>;

  /**
   * 获取会话的最大分组索引
   */
  getMaxGroupIndex(sessionUuid: string): Promise<number>;
}
