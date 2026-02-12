/**
 * KeyResult Weight Snapshot Repository Interface
 * KR 权重快照仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
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
 * - 权重快照的持久化操作
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
   * @param goalUuid - Goal UUID
   * @param page - 页码（从 1 开始）
   * @param pageSize - 每页数量
   * @returns 快照列表和总数（按时间倒序）
   */
  findByGoal(goalUuid: string, page?: number, pageSize?: number): Promise<SnapshotQueryResult>;

  /**
   * 查询 KeyResult 的所有快照
   *
   * @param krUuid - KeyResult UUID
   * @param page - 页码（从 1 开始）
   * @param pageSize - 每页数量
   * @returns 快照列表和总数（按时间倒序）
   */
  findByKeyResult(krUuid: string, page?: number, pageSize?: number): Promise<SnapshotQueryResult>;

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
   * 通过 UUID 查找快照
   *
   * @param uuid - 快照 UUID
   * @returns 快照实例，不存在则返回 null
   */
  findById(uuid: string): Promise<KeyResultWeightSnapshot | null>;

  /**
   * 删除快照
   *
   * @param uuid - 快照 UUID
   */
  delete(uuid: string): Promise<void>;

  /**
   * 删除 Goal 的所有快照
   *
   * @param goalUuid - Goal UUID
   */
  deleteByGoal(goalUuid: string): Promise<void>;

  /**
   * 删除 KeyResult 的所有快照
   *
   * @param krUuid - KeyResult UUID
   */
  deleteByKeyResult(krUuid: string): Promise<void>;
}
