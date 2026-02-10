/**
 * Dashboard Desktop Application Service
 *
 * 包装 @dailyuse/dashboard/application-server 的所有 Use Cases
 * 为 Desktop IPC handlers 提供统一的应用服务入口
 */

import {
  GetDashboardStatistics,
  GetWidgetConfig,
  UpdateWidgetConfig,
  ResetWidgetConfig,
  InvalidateDashboardCache,
  DashboardContainer,
} from '@dailyuse/dashboard/application-server';

import type {
  DashboardStatisticsClientDTO,
  WidgetConfigData,
} from '@dailyuse/contracts/dashboard';
import {
  GoalContainer,
  TaskContainer,
  ScheduleContainer,
  ReminderContainer,
} from '@dailyuse/dashboard/infrastructure-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('DashboardDesktopAppService');

/**
 * Dashboard 汇总数据类型
 */
export interface DashboardAllData {
  stats: {
    goals: {
      total: number;
      active: number;
      completed: number;
      paused: number;
      overdue: number;
    };
    tasks: {
      total: number;
      pending: number;
      inProgress: number;
      completed: number;
    };
    schedules: {
      total: number;
      active: number;
      paused: number;
      todayCount: number;
    };
    reminders: {
      total: number;
      enabled: number;
      todayCount: number;
    };
  };
  activeGoals: unknown[];
  todayTasks: unknown[];
  todaySchedules: unknown[];
  upcomingReminders: unknown[];
  timestamp: number;
}

export class DashboardDesktopApplicationService {
  private statisticsService: GetDashboardStatistics | null = null;
  private getWidgetConfigService: GetWidgetConfig | null = null;
  private updateWidgetConfigService: UpdateWidgetConfig | null = null;
  private resetWidgetConfigService: ResetWidgetConfig | null = null;

  constructor() {
    // Services will be lazily initialized when first accessed
    // This ensures all module dependencies are fully configured
  }

  private getStatisticsService(): GetDashboardStatistics {
    if (!this.statisticsService) {
      this.statisticsService = GetDashboardStatistics.getInstance();
    }
    return this.statisticsService;
  }

  private getWidgetService(): GetWidgetConfig {
    if (!this.getWidgetConfigService) {
      this.getWidgetConfigService = GetWidgetConfig.getInstance();
    }
    return this.getWidgetConfigService;
  }

  private getUpdateWidgetService(): UpdateWidgetConfig {
    if (!this.updateWidgetConfigService) {
      this.updateWidgetConfigService = UpdateWidgetConfig.getInstance();
    }
    return this.updateWidgetConfigService;
  }

  private getResetWidgetService(): ResetWidgetConfig {
    if (!this.resetWidgetConfigService) {
      this.resetWidgetConfigService = ResetWidgetConfig.getInstance();
    }
    return this.resetWidgetConfigService;
  }

  // ===== Statistics =====

  /**
   * 获取 Dashboard 统计数据（带缓存）
   */
  async getStatistics(accountUuid: string): Promise<DashboardStatisticsClientDTO> {
    logger.debug('Getting dashboard statistics', { accountUuid });
    const result = await this.getStatisticsService().execute(accountUuid);
    return result.statistics;
  }

  /**
   * 失效 Dashboard 缓存
   */
  async invalidateCache(accountUuid: string): Promise<void> {
    logger.debug('Invalidating dashboard cache', { accountUuid });
    const container = DashboardContainer.getInstance();
    if (container.hasCacheService()) {
      await InvalidateDashboardCache.getInstance().execute(accountUuid);
    }
  }

  // ===== Widget Config =====

  /**
   * 获取 Widget 配置
   */
  async getWidgetConfig(accountUuid: string): Promise<WidgetConfigData> {
    logger.debug('Getting widget config', { accountUuid });
    const result = await this.getWidgetService().execute(accountUuid);
    return result.widgetConfig;
  }

  /**
   * 更新 Widget 配置
   */
  async updateWidgetConfig(
    accountUuid: string,
    configs: Partial<WidgetConfigData>,
  ): Promise<WidgetConfigData> {
    logger.debug('Updating widget config', { accountUuid });
    const result = await this.getUpdateWidgetService().execute(accountUuid, { configs });
    return result.widgetConfig;
  }

  /**
   * 重置 Widget 配置为默认值
   */
  async resetWidgetConfig(accountUuid: string): Promise<WidgetConfigData> {
    logger.debug('Resetting widget config', { accountUuid });
    const result = await this.getResetWidgetService().execute(accountUuid);
    return result.widgetConfig;
  }

  // ===== Dashboard Overview =====

  /**
   * 获取 Dashboard 概览数据
   * 直接从各模块仓库聚合数据
   */
  async getOverview(accountUuid: string): Promise<{
    goals: { total: number; active: number; completed: number };
    tasks: { total: number; completed: number; pending: number; overdue: number };
    schedule: { todayEvents: number; upcomingEvents: number };
    reminders: { active: number; snoozed: number };
  }> {
    logger.debug('Getting dashboard overview', { accountUuid });
    try {
      const [goalStats, taskStats, scheduleStats, reminderStats] = await Promise.all([
        this.loadGoalStats(accountUuid),
        this.loadTaskStats(accountUuid),
        this.loadScheduleStats(accountUuid),
        this.loadReminderStats(accountUuid),
      ]);

      return {
        goals: {
          total: goalStats.stats.total,
          active: goalStats.stats.active,
          completed: goalStats.stats.completed,
        },
        tasks: {
          total: taskStats.stats.total,
          completed: taskStats.stats.completed,
          pending: taskStats.stats.pending,
          overdue: 0, // TODO: Implement overdue calculation
        },
        schedule: {
          todayEvents: scheduleStats.stats.todayCount,
          upcomingEvents: scheduleStats.stats.active,
        },
        reminders: {
          active: reminderStats.stats.enabled,
          snoozed: 0, // TODO: Add snoozed count when available
        },
      };
    } catch (error) {
      logger.error('Failed to get dashboard overview', error);
      return {
        goals: { total: 0, active: 0, completed: 0 },
        tasks: { total: 0, completed: 0, pending: 0, overdue: 0 },
        schedule: { todayEvents: 0, upcomingEvents: 0 },
        reminders: { active: 0, snoozed: 0 },
      };
    }
  }

  /**
   * 获取今日数据
   */
  async getToday(accountUuid: string): Promise<{
    date: string;
    tasks: unknown[];
    events: unknown[];
    reminders: unknown[];
    goals: unknown[];
  }> {
    logger.debug('Getting today data', { accountUuid });
    try {
      // Fetch today's data from each module
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get tasks
      const taskRepo = TaskContainer.getInstance().getTemplateRepository();
      const tasks = await taskRepo.findByAccount(accountUuid);
      const todayTasks = tasks.filter((t: any) => t.status === 'ACTIVE').slice(0, 10);

      // Get schedules for today
      const scheduleRepo = ScheduleContainer.getInstance().getScheduleTaskRepository();
      const schedules = await scheduleRepo.findByAccountUuid(accountUuid);
      const todaySchedules = schedules
        .filter((s: any) => {
          const scheduledAt = new Date(s.scheduledAt);
          return scheduledAt >= today && scheduledAt < tomorrow;
        })
        .slice(0, 10);

      // Get active goals
      const goalRepo = GoalContainer.getInstance().getGoalRepository();
      const goals = await goalRepo.findByAccountUuid(accountUuid, {});
      const activeGoals = goals.filter((g: any) => g.status === 'ACTIVE').slice(0, 5);

      // Get upcoming reminders
      const reminderRepo = ReminderContainer.getInstance().getTemplateRepository();
      const reminders = await reminderRepo.findByAccountUuid(accountUuid, {});
      const upcomingReminders = reminders
        .filter((r: any) => r.effectiveEnabled)
        .slice(0, 5);

      return {
        date: today.toISOString().split('T')[0]!,
        tasks: todayTasks,
        events: todaySchedules,
        reminders: upcomingReminders,
        goals: activeGoals,
      };
    } catch (error) {
      logger.error('Failed to get today data', error);
      return {
        date: new Date().toISOString().split('T')[0]!,
        tasks: [],
        events: [],
        reminders: [],
        goals: [],
      };
    }
  }

  /**
   * 获取统计数据（按时间段）
   */
  async getStats(
    accountUuid: string,
    period: 'day' | 'week' | 'month',
  ): Promise<{
    period: string;
    productivity: number;
    tasksCompleted: number;
    goalsProgress: number;
    timeTracked: number;
  }> {
    logger.debug('Getting stats', { accountUuid, period });
    try {
      // Basic implementation - can be enhanced later
      const stats = await this.getStatistics(accountUuid);
      const tasksCompleted = stats.taskStats?.completionStats?.totalCompleted ?? 0;
      const totalTasks = stats.summary.totalTasks || 1;
      const goalsCompleted = stats.goalStats?.completedGoals ?? 0;
      const totalGoals = stats.summary.totalGoals || 1;

      return {
        period,
        productivity: Math.round((tasksCompleted / totalTasks) * 100) || 0,
        tasksCompleted,
        goalsProgress: Math.round((goalsCompleted / totalGoals) * 100) || 0,
        timeTracked: 0, // TODO: Integrate with time tracking
      };
    } catch (error) {
      logger.error('Failed to get stats', error);
      return {
        period,
        productivity: 0,
        tasksCompleted: 0,
        goalsProgress: 0,
        timeTracked: 0,
      };
    }
  }

  /**
   * 获取最近活动
   */
  async getRecentActivity(
    accountUuid: string,
    limit = 10,
  ): Promise<{ activities: unknown[]; total: number }> {
    logger.debug('Getting recent activity', { accountUuid, limit });
    // TODO: Implement activity tracking
    return { activities: [], total: 0 };
  }

  // ===== Batch Data (Legacy Support) =====

  /**
   * 批量获取仪表盘所有数据
   * 合并多个 IPC 调用为单次调用，减少 IPC 开销
   */
  async getAllData(accountUuid: string): Promise<DashboardAllData> {
    const startTime = performance.now();
    logger.debug('Getting all dashboard data', { accountUuid });

    try {
      // 并行加载所有数据
      const [goalsResult, tasksResult, schedulesResult, remindersResult] =
        await Promise.all([
          this.loadGoalStats(accountUuid),
          this.loadTaskStats(accountUuid),
          this.loadScheduleStats(accountUuid),
          this.loadReminderStats(accountUuid),
        ]);

      const result: DashboardAllData = {
        stats: {
          goals: goalsResult.stats,
          tasks: tasksResult.stats,
          schedules: schedulesResult.stats,
          reminders: remindersResult.stats,
        },
        activeGoals: goalsResult.activeGoals,
        todayTasks: tasksResult.todayTasks,
        todaySchedules: schedulesResult.todaySchedules,
        upcomingReminders: remindersResult.upcomingReminders,
        timestamp: Date.now(),
      };

      const duration = performance.now() - startTime;
      logger.info(`Dashboard batch load completed in ${duration.toFixed(2)}ms`);

      return result;
    } catch (error) {
      logger.error('Failed to get all dashboard data', error);
      throw error;
    }
  }

  // ===== Private Helper Methods =====

  private async loadGoalStats(accountUuid: string): Promise<{
    stats: DashboardAllData['stats']['goals'];
    activeGoals: unknown[];
  }> {
    try {
      const repo = GoalContainer.getInstance().getGoalRepository();
      const goals = await repo.findByAccountUuid(accountUuid, {});

      const stats = {
        total: goals.length,
        active: goals.filter((g: any) => g.status === 'ACTIVE').length,
        completed: goals.filter((g: any) => g.status === 'COMPLETED').length,
        paused: goals.filter((g: any) => g.status === 'PAUSED').length,
        overdue: goals.filter(
          (g: any) =>
            g.deadline && new Date(g.deadline) < new Date() && g.status === 'ACTIVE',
        ).length,
      };

      const activeGoals = goals.filter((g: any) => g.status === 'ACTIVE').slice(0, 5);

      return { stats, activeGoals };
    } catch (error) {
      logger.warn('Failed to load goal stats', error);
      return {
        stats: { total: 0, active: 0, completed: 0, paused: 0, overdue: 0 },
        activeGoals: [],
      };
    }
  }

  private async loadTaskStats(accountUuid: string): Promise<{
    stats: DashboardAllData['stats']['tasks'];
    todayTasks: unknown[];
  }> {
    try {
      const repo = TaskContainer.getInstance().getTemplateRepository();
      const templates = await repo.findByAccount(accountUuid);

      const stats = {
        total: templates.length,
        pending: templates.filter((t: any) => t.status === 'ACTIVE').length,
        inProgress: templates.filter((t: any) => t.status === 'IN_PROGRESS').length,
        completed: templates.filter((t: any) => t.status === 'COMPLETED').length,
      };

      const todayTasks = templates.filter((t: any) => t.status === 'ACTIVE').slice(0, 10);

      return { stats, todayTasks };
    } catch (error) {
      logger.warn('Failed to load task stats', error);
      return {
        stats: { total: 0, pending: 0, inProgress: 0, completed: 0 },
        todayTasks: [],
      };
    }
  }

  private async loadScheduleStats(accountUuid: string): Promise<{
    stats: DashboardAllData['stats']['schedules'];
    todaySchedules: unknown[];
  }> {
    try {
      const repo = ScheduleContainer.getInstance().getScheduleTaskRepository();
      const schedules = await repo.findByAccountUuid(accountUuid);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayCount = schedules.filter((s: any) => {
        const scheduledAt = new Date(s.scheduledAt);
        return scheduledAt >= today && scheduledAt < tomorrow;
      }).length;

      const stats = {
        total: schedules.length,
        active: schedules.filter(
          (s: any) => s.status === 'ACTIVE' || s.status === 'PENDING',
        ).length,
        paused: schedules.filter((s: any) => s.status === 'PAUSED').length,
        todayCount,
      };

      const todaySchedules = schedules
        .filter((s: any) => {
          const scheduledAt = new Date(s.scheduledAt);
          return scheduledAt >= today && scheduledAt < tomorrow;
        })
        .sort(
          (a: any, b: any) =>
            new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
        )
        .slice(0, 10);

      return { stats, todaySchedules };
    } catch (error) {
      logger.warn('Failed to load schedule stats', error);
      return {
        stats: { total: 0, active: 0, paused: 0, todayCount: 0 },
        todaySchedules: [],
      };
    }
  }

  private async loadReminderStats(accountUuid: string): Promise<{
    stats: DashboardAllData['stats']['reminders'];
    upcomingReminders: unknown[];
  }> {
    try {
      const repo = ReminderContainer.getInstance().getTemplateRepository();
      const reminders = await repo.findByAccountUuid(accountUuid, {});

      const stats = {
        total: reminders.length,
        enabled: reminders.filter((r: any) => r.effectiveEnabled).length,
        todayCount: reminders.filter((r: any) => r.nextTriggerAt != null).length,
      };

      const upcomingReminders = reminders
        .filter((r: any) => r.effectiveEnabled && r.nextTriggerAt != null)
        .sort((a: any, b: any) => (a.nextTriggerAt || 0) - (b.nextTriggerAt || 0))
        .slice(0, 5);

      return { stats, upcomingReminders };
    } catch (error) {
      logger.warn('Failed to load reminder stats', error);
      return {
        stats: { total: 0, enabled: 0, todayCount: 0 },
        upcomingReminders: [],
      };
    }
  }
}
