/**
 * Goal 仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
 * - 使用依赖注入
 * - 隐藏数据访问细节
 */

import type { Goal } from '../aggregates/goal';

/**
 * IGoalRepository 仓储接口
 *
 * 职责：
 * - 定义持久化操作的契约
 * - 聚合根是操作的基本单位
 * - 级联保存/加载子实体
 */
export interface IGoalRepository {
  /**
   * 保存聚合根（创建或更新）
   *
   * 注意：
   * - 这是事务操作
   * - 级联保存所有子实体（KeyResult, GoalReview, GoalRecord）
   * - 如果 UUID 已存在则更新，否则插入
   */
  save(goal: Goal): Promise<void>;

  /**
   * 通过 UUID 查找聚合根
   *
   * @param uuid 目标 UUID
   * @param options.includeChildren 是否加载子实体（默认 false，懒加载）
   * @returns 聚合根实例，不存在则返回 null
   */
  findById(uuid: string, options?: { includeChildren?: boolean }): Promise<Goal | null>;

  /**
   * 通过账户 UUID 查找所有目标
   *
   * @param accountUuid 账户 UUID
   * @param options.includeChildren 是否加载子实体
   * @param options.status 过滤状态
   * @param options.folderUuid 过滤文件夹
   * @returns 目标列表
   */
  findByAccountUuid(
    accountUuid: string,
    options?: {
      includeChildren?: boolean;
      status?: string;
      folderUuid?: string;
    },
  ): Promise<Goal[]>;

  /**
   * 通过文件夹 UUID 查找目标
   *
   * @param folderUuid 文件夹 UUID
   * @returns 目标列表
   */
  findByFolderUuid(folderUuid: string): Promise<Goal[]>;

  /**
   * 删除聚合根
   *
   * 注意：
   * - 这是事务操作
   * - 级联删除所有子实体
   *
   * @param uuid 目标 UUID
   */
  delete(uuid: string): Promise<void>;

  /**
   * 软删除（标记为已删除）
   *
   * @param uuid 目标 UUID
   */
  softDelete(uuid: string): Promise<void>;

  /**
   * 检查目标是否存在
   *
   * @param uuid 目标 UUID
   */
  exists(uuid: string): Promise<boolean>;

  /**
   * 批量更新状态
   *
   * @param uuids 目标 UUID 列表
   * @param status 新状态
   */
  batchUpdateStatus(uuids: string[], status: string): Promise<void>;

  /**
   * 批量移动到文件夹
   *
   * @param uuids 目标 UUID 列表
   * @param folderUuid 目标文件夹 UUID
   */
  batchMoveToFolder(uuids: string[], folderUuid: string | null): Promise<void>;
}
