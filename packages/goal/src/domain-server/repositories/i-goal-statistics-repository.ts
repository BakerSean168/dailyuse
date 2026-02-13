/**
 * IGoalStatisticsRepository - 目标统计仓储接口
 */

import type { GoalStatistics } from '../aggregates';

export interface IGoalStatisticsRepository {
  upsert(statistics: GoalStatistics): Promise<GoalStatistics>;
  findByIdentityId(identityId: string): Promise<GoalStatistics | null>;
  delete(identityId: string): Promise<boolean>;
  exists(identityId: string): Promise<boolean>;
}
