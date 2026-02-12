/**
 * TaskStats Controller
 * 
 * Handles HTTP request logic for task statistics and dashboard.
 * All methods call application services that return Result<T>.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { TaskStatisticsServerDTO } from '@dailyuse/contracts/task';
import type { TaskStatisticsApplicationService } from '../../application-server/services/task-statistics-application-service';

/**
 * TaskStats Controller
 */
export class TaskStatsController {
  constructor(
    private readonly taskStatisticsService: TaskStatisticsApplicationService
  ) {}

  /**
   * Get statistics
   */
  async getStatistics(
    accountUuid: string,
    forceRecalculate = false
  ): Promise<Result<TaskStatisticsServerDTO>> {
    return await this.taskStatisticsService.getStatistics(accountUuid, forceRecalculate);
  }

  /**
   * Recalculate statistics
   */
  async recalculateStatistics(
    accountUuid: string,
    force = false
  ): Promise<Result<TaskStatisticsServerDTO>> {
    const result = await this.taskStatisticsService.recalculateStatistics(accountUuid, force);
    if (!result.ok) {
      return result as any;
    }
    return { ok: true, data: result.data.toServerDTO() };
  }
}
