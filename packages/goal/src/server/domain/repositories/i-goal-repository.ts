/**
 * Goal 聚合根仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现（Prisma / SQLite）
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
 * - 级联保存/加载子实体（KeyResult, GoalReview, WeightSnapshot）
 */
export interface IGoalRepository {
  /**
   * 保存聚合根（创建或更新）
   *
   * 注意：
   * - 这是事务操作
   * - 级联保存所有子实体（KeyResult, GoalReview）
   * - 如果 ID 已存在则更新，否则插入
   * - WeightSnapshot 只做插入（不可变审计记录）
   */
  save(goal: Goal): Promise<void>;

  /**
   * 通过 ID 查找聚合根
   *
   * @param id - 目标 ID
   * @param options.includeChildren - 是否加载子实体（默认 false，懒加载）
   * @returns 聚合根实例，不存在则返回 null
   */
  findById(id: string, options?: { includeChildren?: boolean }): Promise<Goal | null>;

  /**
   * 通过 identity + ID 查找聚合根（身份隔离读路径）
   *
   * @param identityId - 用户身份 ID
   * @param id - 目标 ID
   * @param options.includeChildren - 是否加载子实体
   * @returns 聚合根实例，不存在或不属于该 identity 则返回 null
   */
  findByIdForIdentity(
    identityId: string,
    id: string,
    options?: { includeChildren?: boolean },
  ): Promise<Goal | null>;

  /**
   * 通过 identityId 查找所有目标
   *
   * @param identityId - 用户身份 ID
   * @param options.includeChildren - 是否加载子实体
   * @param options.status - 过滤状态
   * @param options.folderId - 过滤文件夹
   * @returns 目标列表
   */
  findByIdentityId(
    identityId: string,
    options?: {
      includeChildren?: boolean;
      status?: string;
      folderId?: string;
      systemView?: 'active' | 'completed' | 'expired' | 'deleted';
    },
  ): Promise<Goal[]>;

  /**
   * 通过文件夹 ID 查找目标
   *
   * @param folderId - 文件夹 ID
   * @returns 目标列表
   */
  findByFolderId(identityId: string, folderId: string): Promise<Goal[]>;

  /**
   * 永久删除聚合根（物理删除，必须同时匹配 identity）
   *
   * 注意：
   * - 这是事务操作
   * - 级联删除所有子实体
   * - 仅在聚合根已归档时允许删除（由 use case 层保证）
   *
   * @param identityId - 用户身份 ID
   * @param id - 目标 ID
   */
  delete(identityId: string, id: string): Promise<void>;

  /**
   * 检查目标是否存在
   *
   * @param id - 目标 ID
   */
  exists(id: string): Promise<boolean>;

  /**
   * 批量更新状态
   *
   * @param ids - 目标 ID 列表
   * @param status - 新状态
   */
  batchUpdateStatus(ids: string[], status: string): Promise<void>;

  /**
   * 批量移动到文件夹
   *
   * @param ids - 目标 ID 列表
   * @param folderId - 目标文件夹 ID（null 表示移出文件夹）
   */
  batchMoveToFolder(ids: string[], folderId: string | null): Promise<void>;

  // ================= 层级关系查询 =================

  /**
   * 检查目标是否是另一个目标的祖先
   * 用于循环依赖检测
   *
   * @param potentialAncestorId - 可能是祖先的目标 ID
   * @param potentialDescendantId - 可能是后代的目标 ID
   * @returns 如果 potentialAncestorId 是 potentialDescendantId 的祖先则返回 true
   */
  isAncestor(potentialAncestorId: string, potentialDescendantId: string): Promise<boolean>;

  /**
   * 查找目标的所有直接子目标
   *
   * @param parentId - 父目标 ID
   * @returns 子目标列表
   */
  findChildren(parentId: string): Promise<Goal[]>;
}
