/**
 * KR 权重快照仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现（Prisma / SQLite）
 * - 使用依赖注入
 * - 隐藏数据访问细节
 */

import type { KeyResultWeightSnapshot } from '../value-objects';

/**
 * 快照查询结果
 */
export interface SnapshotQueryResult {
  snapshots: KeyResultWeightSnapshot[];
  total: number;
}

/**
 * IWeightSnapshotRepository 仓储接口
 *
 * 职责：
 * - 权重快照的持久化操作（不可变，只增不改）
 * - 提供多维度查询（按 Goal、按 KR、按时间范围）
 * - 支持分页查询
 */
export interface IWeightSnapshotRepository {
  /**
   * 保存权重快照
   *
   * @param snapshot - 快照值对象
   */
  save(snapshot: KeyResultWeightSnapshot): Promise<void>;

  /**
   * 批量保存权重快照
   *
   * @param snapshots - 快照数组
   */
  saveMany(snapshots: KeyResultWeightSnapshot[]): Promise<void>;

  /**
   * 查询 Goal 的所有快照
   *
   * @param goalId - Goal ID
   * @param page - 页码（从 1 开始）
   * @param pageSize - 每页数量
   * @returns 快照列表和总数（按时间倒序）
   */
  findByGoal(goalId: string, page?: number, pageSize?: number): Promise<SnapshotQueryResult>;

  /**
   * 查询 KeyResult 的所有快照
   *
   * @param keyResultId - KeyResult ID
   * @param page - 页码（从 1 开始）
   * @param pageSize - 每页数量
   * @returns 快照列表和总数（按时间倒序）
   */
  findByKeyResult(keyResultId: string, page?: number, pageSize?: number): Promise<SnapshotQueryResult>;

  /**
   * 查询时间范围内的快照
   *
   * @param startTime - 开始时间戳
   * @param endTime - 结束时间戳
   * @param page - 页码（从 1 开始）
   * @param pageSize - 每页数量
   * @returns 快照列表和总数（按时间升序）
   */
  findByTimeRange(
    startTime: number,
    endTime: number,
    page?: number,
    pageSize?: number,
  ): Promise<SnapshotQueryResult>;

  /**
   * 通过 ID 查找快照
   *
   * @param id - 快照 ID
   * @returns 快照实例，不存在则返回 null
   */
  findById(id: string): Promise<KeyResultWeightSnapshot | null>;

  /**
   * 删除快照
   *
   * @param id - 快照 ID
   */
  delete(id: string): Promise<void>;

  /**
   * 删除 Goal 的所有快照
   *
   * @param goalId - Goal ID
   */
  deleteByGoal(goalId: string): Promise<void>;

  /**
   * 删除 KeyResult 的所有快照
   *
   * @param keyResultId - KeyResult ID
   */
  deleteByKeyResult(keyResultId: string): Promise<void>;
}
