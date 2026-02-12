/**
 * GoalRecord 仓储接口
 *
 * 【DDD 仓储模式】
 * - 只定义接口，不实现
 * - 由基础设施层（infrastructure-server）实现
 * - 使用依赖注入
 * - 隐藏数据访问细节
 *
 * 【职责】
 * 提供 GoalRecord（进度记录）的查询操作
 * - 按 KeyResult 查询所有记录
 * - 按 Goal 查询所有记录
 * - 支持时间范围过滤
 *
 * 【一致性原则】
 * 仓储统一返回实体对象（Entity），而非 DTO
 * 这与其他仓储（IGoalRepository 等）保持一致
 */

import type { GoalRecordQueryOptionsDTO } from '@dailyuse/contracts/goal';
import type { GoalRecord } from '../aggregates/goal-record';

/**
 * GoalRecord 查询选项（领域层扩展）
 * 
 * 继承 Contracts 中的 DTO 定义，但使用 Date 类型以便领域层操作
 */
export interface GoalRecordQueryOptions {
  /**
   * 开始时间（可选）
   * 只返回 recordedAt >= startTime 的记录
   */
  startTime?: Date;

  /**
   * 结束时间（可选）
   * 只返回 recordedAt <= endTime 的记录
   */
  endTime?: Date;

  /**
   * 排序方式（默认 'asc'）
   * - 'asc': 按时间升序（最早的在前）
   * - 'desc': 按时间降序（最新的在前）
   */
  orderBy?: 'asc' | 'desc';

  /**
   * 限制返回数量（可选）
   */
  limit?: number;
}

/**
 * 将 DTO 查询选项转换为领域层查询选项
 */
export function toGoalRecordQueryOptions(dto: GoalRecordQueryOptionsDTO): GoalRecordQueryOptions {
  return {
    startTime: dto.startTime ? new Date(dto.startTime) : undefined,
    endTime: dto.endTime ? new Date(dto.endTime) : undefined,
    orderBy: dto.orderBy,
    limit: dto.limit,
  };
}

/**
 * IGoalRecordRepository 仓储接口
 *
 * 【设计说明】
 * GoalRecord 是 KeyResult 的子对象，但为了性能考虑：
 * - 查询操作通过独立的 Repository 接口
 * - 保存操作通过 Goal 聚合根级联完成
 *
 * 【返回类型】
 * 统一返回 GoalRecord 实体对象，而非 DTO
 * 这样保持与其他 Repository 的一致性
 */
export interface IGoalRecordRepository {
  /**
   * 按 KeyResult UUID 查询所有记录
   *
   * 【使用场景】
   * GoalProgressCalculator 服务需要查询某个 KR 的所有历史记录
   * 然后传给 KeyResultProgress.recalculateFromHistory() 进行纯计算
   *
   * @param keyResultId KeyResult 的 UUID
   * @param options 查询选项
   * @returns 实体列表（按 recordedAt 排序）
   */
  findByKeyResultId(
    keyResultId: string,
    options?: GoalRecordQueryOptions,
  ): Promise<GoalRecord[]>;

  /**
   * 按 Goal UUID 查询所有记录
   *
   * 【使用场景】
   * 批量重新计算一个 Goal 下所有 KR 的进度
   *
   * @param goalId Goal 的 UUID
   * @param options 查询选项
   * @returns 实体列表（按 recordedAt 排序）
   */
  findByGoalId(
    goalId: string,
    options?: GoalRecordQueryOptions,
  ): Promise<GoalRecord[]>;

  /**
   * 按多个 KeyResult UUID 批量查询记录
   *
   * 【使用场景】
   * 批量计算多个 KR 的进度，减少数据库查询次数
   *
   * @param keyResultIds KeyResult UUID 列表
   * @param options 查询选项
   * @returns Map<keyResultId, records[]>
   */
  findByKeyResultIds(
    keyResultIds: string[],
    options?: GoalRecordQueryOptions,
  ): Promise<Map<string, GoalRecord[]>>;

  /**
   * 获取 KeyResult 的记录数量
   *
   * 【使用场景】
   * 判断是否需要重新计算（如果记录数变化了）
   *
   * @param keyResultId KeyResult 的 UUID
   * @returns 记录数量
   */
  countByKeyResultId(keyResultId: string): Promise<number>;

  /**
   * 保存单条记录
   *
   * @param record 实体对象
   */
  save(record: GoalRecord): Promise<void>;

  /**
   * 删除记录
   *
   * @param recordId 记录 UUID
   */
  delete(recordId: string): Promise<void>;

  /**
   * 批量删除记录
   *
   * @param recordIds 记录 UUID 列表
   */
  deleteMany(recordIds: string[]): Promise<void>;
}
