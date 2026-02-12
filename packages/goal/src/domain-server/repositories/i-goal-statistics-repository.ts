/**
 * IGoalStatisticsRepository - 目标统计仓储接口
 */

import type { GoalStatistics } from '../aggregates';

export interface IGoalStatisticsRepository {
  upsert(statistics: GoalStatistics): Promise<GoalStatistics>;
  findByAccountUuid(accountUuid: string): Promise<GoalStatistics | null>;
  delete(accountUuid: string): Promise<boolean>;
  exists(accountUuid: string): Promise<boolean>;
}
