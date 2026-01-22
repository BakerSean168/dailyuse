/**
 * Dashboard Statistics Application Service
 * Dashboard 统计应用服务
 *
 * 架构职责：
 * - 协调多个模块的 Statistics 仓储
 * - 聚合统计数据生成 Dashboard 视图
 * - 集成缓存服务提升性能
 * - DTO 转换（Domain ↔ Contracts）
 *
 * 架构层次：Application Layer
 */

import type { ITaskStatisticsRepository } from '@dailyuse/domain-server/task';
import type { IGoalStatisticsRepository } from '@dailyuse/domain-server/goal';
import type { IReminderStatisticsRepository } from '@dailyuse/domain-server/reminder';
import type { IScheduleStatisticsRepository } from '@dailyuse/domain-server/schedule';
import type { IStatisticsCacheService } from '@dailyuse/domain-server/dashboard';
import { TaskStatistics } from '@dailyuse/domain-server/task';
import { GoalStatistics } from '@dailyuse/domain-server/goal';
import { ReminderStatistics } from '@dailyuse/domain-server/reminder';
import { ScheduleStatistics } from '@dailyuse/domain-server/schedule';
import type { DashboardStatisticsClientDTO } from '@dailyuse/contracts/dashboard';
import type { TaskStatisticsClientDTO } from '@dailyuse/contracts/task';
import type { GoalStatisticsClientDTO } from '@dailyuse/contracts/goal';
import type { ReminderStatisticsClientDTO } from '@dailyuse/contracts/reminder';
import type { ScheduleStatisticsClientDTO } from '@dailyuse/contracts/schedule';

export class DashboardStatisticsApplicationService {
  constructor(
    private readonly taskStatsRepo: ITaskStatisticsRepository,
    private readonly goalStatsRepo: IGoalStatisticsRepository,
    private readonly reminderStatsRepo: IReminderStatisticsRepository,
    private readonly scheduleStatsRepo: IScheduleStatisticsRepository,
    private readonly cacheService: IStatisticsCacheService,
  ) {}

  /**
   * 获取 Dashboard 统计数据（带缓存）
   */
  async getDashboardStatistics(accountUuid: string): Promise<DashboardStatisticsClientDTO> {
    const startTime = Date.now();
    console.log(`[Dashboard] 开始获取账户 ${accountUuid} 的统计数据`);

    try {
      // 1. 尝试从缓存获取
      const cached = await this.cacheService.get(accountUuid);
      if (cached) {
        const duration = Date.now() - startTime;
        console.log(`[Dashboard] ✅ 缓存命中，耗时 ${duration}ms`);
        return cached;
      }

      // 2. 缓存未命中，聚合数据
      const stats = await this.aggregateStatistics(accountUuid);

      // 3. 写入缓存
      await this.cacheService.set(accountUuid, stats);

      const duration = Date.now() - startTime;
      console.log(`[Dashboard] 统计聚合完成，耗时 ${duration}ms (目标: ≤100ms)`);

      if (duration > 100) {
        console.warn(`[Dashboard] ⚠️  响应时间超过目标 (${duration}ms > 100ms)`);
      }

      return stats;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Dashboard] 统计聚合失败，耗时 ${duration}ms:`, error);
      throw new Error(
        `Failed to get dashboard statistics: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 聚合统计数据（核心逻辑）
   */
  private async aggregateStatistics(accountUuid: string): Promise<DashboardStatisticsClientDTO> {
    // 并行查询 4 个模块的统计数据
    const [taskStats, goalStats, reminderStats, scheduleStats] = await Promise.all([
      this.getOrCreateTaskStatistics(accountUuid),
      this.getOrCreateGoalStatistics(accountUuid),
      this.getOrCreateReminderStatistics(accountUuid),
      this.getOrCreateScheduleStatistics(accountUuid),
    ]);

    // 转换为 ClientDTO
    const taskStatsDto = taskStats.toClientDTO();
    const goalStatsDto = goalStats.toClientDTO();
    const reminderStatsDto = reminderStats.toClientDTO();
    const scheduleStatsDto = scheduleStats.toClientDTO();

    // 计算总体完成率
    const overallCompletionRate = this.calculateOverallCompletionRate({
      taskStatsDto,
      goalStatsDto,
      reminderStatsDto,
      scheduleStatsDto,
    });

    // 构建 Dashboard DTO (符合 DashboardStatisticsClientDTO 接口)
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

  /**
   * 失效缓存
   */
  async invalidateCache(accountUuid: string): Promise<void> {
    console.log(`[Dashboard] 失效账户 ${accountUuid} 的缓存`);
    await this.cacheService.invalidate(accountUuid);
  }

  // ===== 获取或创建 Statistics =====

  private async getOrCreateTaskStatistics(accountUuid: string): Promise<TaskStatistics> {
    const stats = await this.taskStatsRepo.findByAccountUuid(accountUuid);

    if (!stats) {
      console.log(`[Dashboard] 账户 ${accountUuid} 没有 TaskStatistics，使用默认值`);
      return TaskStatistics.createDefault(accountUuid);
    }

    return stats;
  }

  private async getOrCreateGoalStatistics(accountUuid: string): Promise<GoalStatistics> {
    const stats = await this.goalStatsRepo.findByAccountUuid(accountUuid);

    if (!stats) {
      console.log(`[Dashboard] 账户 ${accountUuid} 没有 GoalStatistics，使用默认值`);
      return GoalStatistics.createEmpty(accountUuid);
    }

    return stats;
  }

  private async getOrCreateReminderStatistics(accountUuid: string): Promise<ReminderStatistics> {
    const stats = await this.reminderStatsRepo.findByAccountUuid(accountUuid);

    if (!stats) {
      console.log(`[Dashboard] 账户 ${accountUuid} 没有 ReminderStatistics，使用默认值`);
      return ReminderStatistics.create({ accountUuid });
    }

    return stats;
  }

  private async getOrCreateScheduleStatistics(accountUuid: string): Promise<ScheduleStatistics> {
    const stats = await this.scheduleStatsRepo.findByAccountUuid(accountUuid);

    if (!stats) {
      console.log(`[Dashboard] 账户 ${accountUuid} 没有 ScheduleStatistics，使用默认值`);
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

    // Task 完成率（今日任务完成率）
    const todayInstances = stats.taskStatsDto.instanceStats?.todayInstances ?? 0;
    const todayCompleted = stats.taskStatsDto.completionStats?.todayCompleted ?? 0;
    if (todayInstances > 0) {
      const taskRate = todayCompleted / todayInstances;
      rates.push(taskRate);
    }

    // Goal 平均进度
    if (stats.goalStatsDto.totalGoals > 0) {
      const goalRate = stats.goalStatsDto.averageProgress / 100;
      rates.push(goalRate);
    }

    // Reminder 触发成功率
    const totalTriggers = stats.reminderStatsDto.triggerStats?.totalTriggers ?? 0;
    const successfulTriggers = stats.reminderStatsDto.triggerStats?.successfulTriggers ?? 0;
    if (totalTriggers > 0) {
      const reminderRate = successfulTriggers / totalTriggers;
      rates.push(reminderRate);
    }

    // Schedule 执行成功率
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
