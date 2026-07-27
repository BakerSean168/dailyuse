/**
 * Get Task Dashboard Service
 *
 * 鑾峰彇浠诲姟浠爮鏉挎暟锟?
 */

import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import type { TaskFilters } from '../../../domain/repositories/i-task-template-repository';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

interface TaskDashboardResponse {
  todayTasks: TaskTemplateClientDTO[];
  overdueTasks: TaskTemplateClientDTO[];
  upcomingTasks: TaskTemplateClientDTO[];
  highPriorityTasks: TaskTemplateClientDTO[];
  blockedTasks: TaskTemplateClientDTO[];
  summary: {
    totalTasks: number;
    completedToday: number;
    overdue: number;
    upcoming: number;
    highPriority: number;
  };
}

/**
 * Get Task Dashboard Service
 */
export class GetTaskDashboardUseCase {
  constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  async execute(identityId: string): Promise<Result<TaskDashboardResponse>> {

    // 骞惰鏌ヨ鎵€鏈夋暟锟?
    const [
      today,
      overdue,
      blocked,
      upcoming,
      highPriority,
      _recentCompleted,
      totalActive,
      totalCompleted,
    ] = await Promise.all([
      this.getTodayTasks(identityId),
      this.getOverdueTasks(identityId),
      this.getBlockedTasks(identityId),
      this.getUpcomingTasks(identityId, 7),
      this.getHighPriorityTasks(identityId, 5),
      this.getRecentCompletedTasks(identityId, 10),
      this.countTasks(identityId, { status: TaskTemplateStatus.Active }),
      this.countTasks(identityId, { status: TaskTemplateStatus.Archived }),
    ]);

    const _completionRate =
      totalActive + totalCompleted > 0
        ? Math.round((totalCompleted / (totalActive + totalCompleted)) * 100)
        : 0;

    return ok({
      todayTasks: today,
      overdueTasks: overdue,
      upcomingTasks: upcoming,
      highPriorityTasks: highPriority,
      blockedTasks: blocked,
      summary: {
        totalTasks: totalActive + totalCompleted,
        completedToday: totalCompleted,
        overdue: overdue.length,
        upcoming: upcoming.length,
        highPriority: highPriority.length,
      },
    });
  }

  private async getTodayTasks(identityId: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findTodayTasks(identityId);
    return tasks.map((t) => t.toClientDTO());
  }

  private async getOverdueTasks(identityId: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findOverdueTasks(identityId);
    return tasks.map((t) => t.toClientDTO());
  }

  private async getBlockedTasks(identityId: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findBlockedTasks(identityId);
    return tasks.map((t) => t.toClientDTO());
  }

  private async getUpcomingTasks(identityId: string, daysAhead: number): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findUpcomingTasks(identityId, daysAhead);
    return tasks.map((t) => t.toClientDTO());
  }

  private async getHighPriorityTasks(identityId: string, limit: number): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findSortedByPriority(identityId, limit);
    return tasks.map((t) => t.toClientDTO());
  }

  private async getRecentCompletedTasks(identityId: string, limit: number): Promise<TaskTemplateClientDTO[]> {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const tasks = await this.templateRepository.findOneTimeTasks(identityId, {
      status: TaskTemplateStatus.Archived,
    });

    return tasks
      .filter((t) => t.updatedAt && Number(t.updatedAt) >= sevenDaysAgo)
      .sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0))
      .slice(0, limit)
      .map((t) => t.toClientDTO());
  }

  private async countTasks(identityId: string, filters?: TaskFilters): Promise<number> {
    return await this.templateRepository.countTasks(identityId, filters);
  }
}
