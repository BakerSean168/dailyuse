/**
 * GoalStatistics 仓储接口
 *
 * DDD 仓储模式：
 * - 定义聚合根的持久化接口
 * - 使用领域对象作为参数和返回值
 * - 不包含业务逻辑
 */

import type { GoalStatistics } from '../aggregates/GoalStatistics';

/**
 * GoalStatistics 仓储接口
 *
 * 负责 GoalStatistics 聚合根的持久化操作
 */
export interface IGoalStatisticsRepository {
  /**
   * 根据账户UUID查找统计信息
   *
   * @param accountUuid - 账户UUID
   * @returns 统计聚合根，不存在则返回 null
   */
  findByAccountUuid(accountUuid: string): Promise<GoalStatistics | null>;

  /**
   * 插入或更新统计信息（Upsert）
   *
   * 如果账户的统计信息已存在，则更新；否则创建新记录
   *
   * @param statistics - 统计聚合根
   * @returns 更新后的统计聚合根
   */
  upsert(statistics: GoalStatistics): Promise<GoalStatistics>;

  /**
   * 删除统计信息
   *
   * 用于账户删除时清理统计数据
   *
   * @param accountUuid - 账户UUID
   * @returns 是否删除成功
   */
  delete(accountUuid: string): Promise<boolean>;

  /**
   * 检查统计信息是否存在
   *
   * @param accountUuid - 账户UUID
   * @returns 是否存在
   */
  exists(accountUuid: string): Promise<boolean>;
}
