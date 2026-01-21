/**
 * Get Dashboard Statistics
 *
 * 获取 Dashboard 统计数据 - 聚合各模块统计数据
 * 依赖注入模式：所有仓储和服务通过构造函数注入
 */

import type { ITaskStatisticsRepository } from '@dailyuse/domain-server/task';
import type { IGoalStatisticsRepository } from '@dailyuse/domain-server/goal';
import type { IReminderStatisticsRepository } from '@dailyuse/domain-server/reminder';
import type { IScheduleStatisticsRepository } from '@dailyuse/domain-server/schedule';
import type { IStatisticsCacheService } from '@dailyuse/domain-server/common';
import { TaskStatistics } from '@dailyuse/domain-server/task';
import { GoalStatistics } from '@dailyuse/domain-server/goal';
import { ReminderStatistics } from '@dailyuse/domain-server/reminder';
import { ScheduleStatistics } from '@dailyuse/domain-server/schedule';
import type {
  DashboardStatisticsResponse,
  DashboardStatisticsClientDTO,
} from '@dailyuse/contracts/dashboard';
import type { TaskStatisticsClientDTO } from '@dailyuse/contracts/task';
import type { GoalStatisticsClientDTO } from '@dailyuse/contracts/goal';
import type { ReminderStatisticsClientDTO } from '@dailyuse/contracts/reminder';
import type { ScheduleStatisticsClientDTO } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GetDashboardStatistics');

/**
 * Get Dashboard Statistics
 */
export class GetDashboardStatistics {
  private static instance: GetDashboardStatistics | undefined;

  constructor(
    private readonly taskStatsRepo: ITaskStatisticsRepository,
    private readonly goalStatsRepo: IGoalStatisticsRepository,
    private readonly reminderStatsRepo: IReminderStatisticsRepository,
    private readonly scheduleStatsRepo: IScheduleStatisticsRepository,
    private readonly cacheService?: IStatisticsCacheService,
  ) {}

  /**
   * 获取服务单例
   */
  static getInstance(): GetDashboardStatistics {
    if (!GetDashboardStatistics.instance) {
      throw new Error('GetDashboardStatistics not initialized. Call setInstance() first.');
    }
    return GetDashboardStatistics.instance;
  }

  /**
   * 设置服务单例
   */
  static setInstance(instance: GetDashboardStatistics): void {
    GetDashboardStatistics.instance = instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetDashboardStatistics.instance = undefined;
  }

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<DashboardStatisticsResponse> {
    const startTime = Date.now();
    logger.info(`开始获取账户 ${accountUuid} 的统计数据`);

    try {
      if (this.cacheService) {
        const cached = await this.cacheService.get<DashboardStatisticsClientDTO>(accountUuid);
        if (cached) {
          const duration = Date.now() - startTime;
          logger.info(`缓存命中，耗时 ${duration}ms`);
          return { statistics: cached };
        }
      }

      const stats = await this.aggregateStatistics(accountUuid);

      if (this.cacheService) {
        await this.cacheService.set(accountUuid, stats);
      }

      const duration = Date.now() - startTime;
      logger.info(`统计聚合完成，耗时 ${duration}ms (目标: ≤100ms)`);

      if (duration > 100) {
        logger.warn(`响应时间超过目标 (${duration}ms > 100ms)`);
      }

      return { statistics: stats };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`统计聚合失败，耗时 ${duration}ms`, error);
      throw new Error(
        `Failed to get dashboard statistics: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 聚合统计数据（核心逻辑）
   */
  private async aggregateStatistics(accountUuid: string): Promise<DashboardStatisticsClientDTO> {
    const [taskStats, goalStats, reminderStats, scheduleStats] = await Promise.all([
      this.getOrCreateTaskStatistics(accountUuid),
      this.getOrCreateGoalStatistics(accountUuid),
      this.getOrCreateReminderStatistics(accountUuid),
      this.getOrCreateScheduleStatistics(accountUuid),
    ]);

    const taskStatsDto = taskStats.toClientDTO();
    const goalStatsDto = goalStats.toClientDTO();
    const reminderStatsDto = reminderStats.toClientDTO();
    const scheduleStatsDto = scheduleStats.toClientDTO();

    const overallCompletionRate = this.calculateOverallCompletionRate({
      taskStatsDto,
      goalStatsDto,
      reminderStatsDto,
      scheduleStatsDto,
    });

    return {
      accountUuid,
      summary: {
        totalTasks: taskStatsDto.templateStats?.totalTemplates ?? 0,
        totalGoals: goalStatsDto.totalGoals ?? 0,
        totalReminders: reminderStatsDto.templateStats?.totalTemplates ?? 0,
        totalScheduleTasks: scheduleStatsDto.totalTasks ?? 0,
        overallCompletionRate,
      },
      taskStats: taskStatsDto,
      goalStats: goalStatsDto,
      reminderStats: reminderStatsDto,
      scheduleStats: scheduleStatsDto,
      calculatedAt: Date.now(),
      cacheHit: false,
    };
  }

  // ===== 获取或创建 Statistics =====

  private async getOrCreateTaskStatistics(accountUuid: string): Promise<TaskStatistics> {
    const stats = await this.taskStatsRepo.findByAccountUuid(accountUuid);

    if (!stats) {
      logger.info(`账户 ${accountUuid} 没有 TaskStatistics，使用默认值`);
      return TaskStatistics.createDefault(accountUuid);
    }

    return stats;
  }

  private async getOrCreateGoalStatistics(accountUuid: string): Promise<GoalStatistics> {
    const stats = await this.goalStatsRepo.findByAccountUuid(accountUuid);

    if (!stats) {
      logger.info(`账户 ${accountUuid} 没有 GoalStatistics，使用默认值`);
      return GoalStatistics.createEmpty(accountUuid);
    }

    return stats;
  }

  private async getOrCreateReminderStatistics(accountUuid: string): Promise<ReminderStatistics> {
    const stats = await this.reminderStatsRepo.findByAccountUuid(accountUuid);

    if (!stats) {
      logger.info(`账户 ${accountUuid} 没有 ReminderStatistics，使用默认值`);
      return ReminderStatistics.create({ accountUuid });
    }

    return stats;
  }

  private async getOrCreateScheduleStatistics(accountUuid: string): Promise<ScheduleStatistics> {
    const stats = await this.scheduleStatsRepo.findByAccountUuid(accountUuid);

    if (!stats) {
      logger.info(`账户 ${accountUuid} 没有 ScheduleStatistics，使用默认值`);
      return ScheduleStatistics.createEmpty(accountUuid);
    }

    return stats;
  }

  // ===== 计算方法 =====

  private calculateOverallCompletionRate(stats: {
    taskStatsDto: TaskStatisticsClientDTO;
    goalStatsDto: GoalStatisticsClientDTO;
    reminderStatsDto: ReminderStatisticsClientDTO;
    scheduleStatsDto: ScheduleStatisticsClientDTO;
  }): number {
    const rates: number[] = [];

    const todayInstances = stats.taskStatsDto.instanceStats?.todayInstances ?? 0;
    const todayCompleted = stats.taskStatsDto.completionStats?.todayCompleted ?? 0;
    if (todayInstances > 0) {
      const taskRate = todayCompleted / todayInstances;
      rates.push(taskRate);
    }

    if (stats.goalStatsDto.totalGoals > 0) {
      const goalRate = stats.goalStatsDto.averageProgress / 100;
      rates.push(goalRate);
    }

    const totalTriggers = stats.reminderStatsDto.triggerStats?.totalTriggers ?? 0;
    const successfulTriggers = stats.reminderStatsDto.triggerStats?.successfulTriggers ?? 0;
    if (totalTriggers > 0) {
      const reminderRate = successfulTriggers / totalTriggers;
      rates.push(reminderRate);
    }

    if (stats.scheduleStatsDto.totalExecutions > 0) {
      const scheduleRate =
        stats.scheduleStatsDto.successfulExecutions / stats.scheduleStatsDto.totalExecutions;
      rates.push(scheduleRate);
    }

    if (rates.length === 0) {
      return 0;
    }

    const sum = rates.reduce((acc, rate) => acc + rate, 0);
    const average = sum / rates.length;

    return Math.round(average * 100) / 100;
  }
}

/**
 * 便捷函数：获取 Dashboard 统计数据
 */
export const getDashboardStatistics = (
  accountUuid: string,
): ReturnType<GetDashboardStatistics['execute']> =>
  GetDashboardStatistics.getInstance().execute(accountUuid);
