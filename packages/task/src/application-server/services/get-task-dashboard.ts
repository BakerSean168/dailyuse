/**
 * Get Task Dashboard Service
 *
 * 获取任务仪表板数�?
 */

import type { ITaskTemplateRepository, TaskFilters } from '../../domain-server/repositories/ITaskTemplateRepository';
import type { TaskTemplateClientDTO, TaskDashboardResponse } from '@dailyuse/contracts/task';
import { TaskType } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Get Task Dashboard Service
 */
export class GetTaskDashboard {
  constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  async execute(accountUuid: string): Promise<Result<TaskDashboardResponse>> {

    // 并行查询所有数�?
    const [
      today,
      overdue,
      blocked,
      upcoming,
      highPriority,
      recentCompleted,
      totalActive,
      totalCompleted,
    ] = await Promise.all([
      this.getTodayTasks(accountUuid),
      this.getOverdueTasks(accountUuid),
      this.getBlockedTasks(accountUuid),
      this.getUpcomingTasks(accountUuid, 7),
      this.getHighPriorityTasks(accountUuid, 5),
      this.getRecentCompletedTasks(accountUuid, 10),
      this.countTasks(accountUuid, { taskType: TaskType.ONE_TIME, status: 'TODO' as any }),
      this.countTasks(accountUuid, { taskType: TaskType.ONE_TIME, status: 'COMPLETED' as any }),
    ]);

    const completionRate =
      totalActive + totalCompleted > 0
        ? Math.round((totalCompleted / (totalActive + totalCompleted)) * 100)
        : 0;

    return ok({
      todayTasks: today as any,
      overdueTasks: overdue as any,
      upcomingTasks: upcoming as any,
      highPriorityTasks: highPriority as any,
      blockedTasks: blocked as any,
      summary: {
        totalTasks: totalActive + totalCompleted,
        completedToday: totalCompleted,
        overdue: overdue.length,
        upcoming: upcoming.length,
        highPriority: highPriority.length,
      },
    });
  }

  private async getTodayTasks(accountUuid: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findTodayTasks(accountUuid);
    return tasks.map((t) => t.toClientDTO());
  }

  private async getOverdueTasks(accountUuid: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findOverdueTasks(accountUuid);
    return tasks.map((t) => t.toClientDTO());
  }

  private async getBlockedTasks(accountUuid: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findBlockedTasks(accountUuid);
    return tasks.map((t) => t.toClientDTO());
  }

  private async getUpcomingTasks(accountUuid: string, daysAhead: number): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findUpcomingTasks(accountUuid, daysAhead);
    return tasks.map((t) => t.toClientDTO());
  }

  private async getHighPriorityTasks(accountUuid: string, limit: number): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findTasksSortedByPriority(accountUuid, limit);
    return tasks.map((t) => t.toClientDTO());
  }

  private async getRecentCompletedTasks(accountUuid: string, limit: number): Promise<TaskTemplateClientDTO[]> {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const tasks = await this.templateRepository.findOneTimeTasks(accountUuid, {
      taskType: TaskType.ONE_TIME,
      status: 'COMPLETED' as any,
    });

    return tasks
      .filter((t) => t.updatedAt && t.updatedAt >= sevenDaysAgo)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, limit)
      .map((t) => t.toClientDTO());
  }

  private async countTasks(accountUuid: string, filters?: TaskFilters): Promise<number> {
    return await this.templateRepository.countTasks(accountUuid, filters);
  }
}

