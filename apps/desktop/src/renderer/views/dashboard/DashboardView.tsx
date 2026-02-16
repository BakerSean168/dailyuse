/**
 * Dashboard View
 *
 * The main dashboard screen displaying a high-level overview of the user's data.
 * Aggregates statistics, upcoming tasks, schedules, and active goals.
 * Supports auto-refresh and quick navigation.
 *
 * EPIC-015 重构: Task 模块使用 Hook 代替直接调用 Infrastructure 层
 *
 * @module renderer/views/dashboard/DashboardView
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardSkeleton } from '../../shared/components/Skeleton';
import { useNavigate } from 'react-router-dom';
import { goalApplicationService } from '@dailyuse/goal/application-client';
import { scheduleApplicationService } from '@dailyuse/schedule/application-client';
import { reminderApplicationService } from '@dailyuse/reminder/application-client';
import { GoalStatus } from '@dailyuse/contracts/goal';
import type { TaskTemplate } from '@dailyuse/task/domain-client';
import { ScheduleTaskStatus } from '@dailyuse/contracts/schedule';
import type { Goal } from '@dailyuse/goal/domain-client';
import type { ScheduleTask } from '@dailyuse/schedule/domain-client';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { useTaskTemplate } from '../../modules/task/presentation/hooks/useTaskTemplate';

import {
  StatCard,
  TodaySchedule,
  UpcomingReminders,
  GoalProgressList,
  QuickActions,
  MiniPieChart,
  type QuickAction,
  type PieDataItem,
} from './components';

// ============ Types ============

/**
 * Aggregated statistics for dashboard display.
 */
interface DashboardStats {
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
}

// ============ Constants ============

const AUTO_REFRESH_INTERVAL = 60000; // 1 minute

// ============ Component ============

export function DashboardView() {
  const navigate = useNavigate();
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Data lists
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [todayTasks, setTodayTasks] = useState<TaskTemplate[]>([]);
  const [todaySchedules, setTodaySchedules] = useState<ScheduleTask[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<ReminderTemplateClientDTO[]>([]);

  // 使用 Hook 获取 Task 数据
  const { templates, getActiveTemplates } = useTaskTemplate();

  // ============ Data Loading ============

  /**
   * Generates an empty statistics object structure.
   */
  const getEmptyStats = useCallback((): DashboardStats => {
    return {
      goals: { total: 0, active: 0, completed: 0, paused: 0, overdue: 0 },
      tasks: { total: 0, pending: 0, inProgress: 0, completed: 0 },
      schedules: { total: 0, active: 0, paused: 0, todayCount: 0 },
      reminders: { total: 0, enabled: 0, todayCount: 0 },
    };
  }, []);

  /**
   * Fetches goal statistics and active goals list.
   */
  const loadGoalStats = useCallback(async () => {
    const goalsResponse = await goalApplicationService.listGoals();
    const goals = goalsResponse.goals;

    const goalStats = {
      total: goals.length,
      active: goals.filter((g: Goal) => g.status === GoalStatus.ACTIVE).length,
      completed: goals.filter((g: Goal) => g.status === GoalStatus.COMPLETED)
        .length,
      paused: 0, // Goal does not have PAUSED, using DRAFT is not equivalent but placeholder
      overdue: goals.filter((g: Goal) => g.isOverdue).length,
    };

    const activeGoalsList = goals
      .filter((g: Goal) => g.status === GoalStatus.ACTIVE)
      .slice(0, 5);

    return { stats: goalStats, activeGoals: activeGoalsList };
  }, []);

  /**
   * Fetches task statistics and task list.
   * EPIC-015: 使用 Hook 提供的 templates 数据，利用 Entity getter
   */
  const loadTaskStats = useCallback(async () => {
    // 使用 Hook 已加载的 templates 数据
    const taskStats = {
      total: templates.length,
      pending: 0, // Placeholder
      inProgress: templates.filter((t: TaskTemplate) => t.isActive).length,
      completed: templates.filter((t: TaskTemplate) => t.isArchived).length,
    };

    const todayTasksList = getActiveTemplates().slice(0, 5);

    return { stats: taskStats, todayTasks: todayTasksList };
  }, [templates, getActiveTemplates]);

  /**
   * Fetches schedule statistics and today's schedule.
   */
  const loadScheduleStats = useCallback(async () => {
    try {
      const schedules = await scheduleApplicationService.listScheduleTasks();

      const scheduleStats = {
        total: schedules.length,
        active: schedules.filter(
          (s: ScheduleTask) => s.status === ScheduleTaskStatus.ACTIVE,
        ).length,
        paused: schedules.filter(
          (s: ScheduleTask) => s.status === ScheduleTaskStatus.PAUSED,
        ).length,
        todayCount: schedules.filter(
          (s: ScheduleTask) => s.status === ScheduleTaskStatus.ACTIVE,
        ).length, // Simplified: Active tasks counted as today's tasks for now
      };

      const todaySchedulesList = schedules
        .filter((s: ScheduleTask) => s.status === ScheduleTaskStatus.ACTIVE)
        .slice(0, 5);

      return { stats: scheduleStats, todaySchedules: todaySchedulesList };
    } catch (error) {
      console.warn('[DashboardView] Schedule module not available:', error);
      return {
        stats: { total: 0, active: 0, paused: 0, todayCount: 0 },
        todaySchedules: [],
      };
    }
  }, []);

  /**
   * Fetches reminder statistics and upcoming reminders.
   */
  const loadReminderStats = useCallback(async () => {
    try {
      const response = await reminderApplicationService.listReminderTemplates();
      const reminders = response.templates;

      const reminderStats = {
        total: reminders.length,
        enabled: reminders.filter(
          (r: ReminderTemplateClientDTO) => r.effectiveEnabled,
        ).length,
        todayCount: reminders.filter(
          (r: ReminderTemplateClientDTO) => r.nextTriggerAt != null,
        ).length,
      };

      // Sort by next trigger time
      const upcomingRemindersList = reminders
        .filter(
          (r: ReminderTemplateClientDTO) =>
            r.effectiveEnabled && r.nextTriggerAt != null,
        )
        .sort(
          (a: ReminderTemplateClientDTO, b: ReminderTemplateClientDTO) =>
            (a.nextTriggerAt || 0) - (b.nextTriggerAt || 0),
        )
        .slice(0, 5);

      return { stats: reminderStats, upcomingReminders: upcomingRemindersList };
    } catch (error) {
      console.warn('[DashboardView] Reminder module not available:', error);
      return {
        stats: { total: 0, enabled: 0, todayCount: 0 },
        upcomingReminders: [],
      };
    }
  }, []);

  /**
   * Orchestrates the loading of all dashboard data in parallel.
   */
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);

      // Load data in parallel
      const [goalsData, tasksData, schedulesData, remindersData] =
        await Promise.allSettled([
          loadGoalStats(),
          loadTaskStats(),
          loadScheduleStats(),
          loadReminderStats(),
        ]);

      // Process Goal Data
      if (goalsData.status === 'fulfilled') {
        const { stats: goalStats, activeGoals: goals } = goalsData.value;
        setStats((prev) => ({ ...(prev || getEmptyStats()), goals: goalStats }));
        setActiveGoals(goals);
      }

      // Process Task Data
      if (tasksData.status === 'fulfilled') {
        const { stats: taskStats, todayTasks: tasks } = tasksData.value;
        setStats((prev) => ({ ...(prev || getEmptyStats()), tasks: taskStats }));
        setTodayTasks(tasks);
      }

      // Process Schedule Data
      if (schedulesData.status === 'fulfilled') {
        const { stats: scheduleStats, todaySchedules: schedules } =
          schedulesData.value;
        setStats((prev) => ({
          ...(prev || getEmptyStats()),
          schedules: scheduleStats,
        }));
        setTodaySchedules(schedules);
      }

      // Process Reminder Data
      if (remindersData.status === 'fulfilled') {
        const { stats: reminderStats, upcomingReminders: reminders } =
          remindersData.value;
        setStats((prev) => ({
          ...(prev || getEmptyStats()),
          reminders: reminderStats,
        }));
        setUpcomingReminders(reminders);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('[DashboardView] Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }, [loadGoalStats, loadTaskStats, loadScheduleStats, loadReminderStats, getEmptyStats]);

  // ============ Auto Refresh ============

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (autoRefreshEnabled) {
      refreshIntervalRef.current = setInterval(() => {
        loadStats();
      }, AUTO_REFRESH_INTERVAL);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefreshEnabled, loadStats]);

  // ============ Quick Actions ============

  const quickActions: QuickAction[] = [
    {
      id: 'new-goal',
      label: 'New Goal',
      icon: '🎯',
      variant: 'primary',
      onClick: () => navigate('/goals'),
    },
    {
      id: 'new-task',
      label: 'New Task',
      icon: '✅',
      variant: 'secondary',
      onClick: () => navigate('/tasks'),
    },
    {
      id: 'new-schedule',
      label: 'New Schedule',
      icon: '📅',
      variant: 'outline',
      onClick: () => navigate('/schedules'),
    },
    {
      id: 'new-reminder',
      label: 'New Reminder',
      icon: '⏰',
      variant: 'outline',
      onClick: () => navigate('/reminders'),
    },
  ];

  // ============ Chart Data ============

  const goalStatusData: PieDataItem[] = stats
    ? [
        { label: 'Active', value: stats.goals.active, color: '#22c55e' },
        { label: 'Completed', value: stats.goals.completed, color: '#3b82f6' },
        { label: 'Paused', value: stats.goals.paused, color: '#eab308' },
      ].filter((d) => d.value > 0)
    : [];

  const taskStatusData: PieDataItem[] = stats
    ? [
        { label: 'Pending', value: stats.tasks.pending, color: '#f59e0b' },
        { label: 'In Progress', value: stats.tasks.inProgress, color: '#3b82f6' },
        { label: 'Completed', value: stats.tasks.completed, color: '#22c55e' },
      ].filter((d) => d.value > 0)
    : [];

  // ============ Render ============

  // Show skeleton loader if initial load
  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto Refresh Toggle */}
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              className="rounded"
            />
            Auto Refresh
          </label>
          {/* Manual Refresh Button */}
          <button
            onClick={loadStats}
            disabled={loading}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* Last Updated Timestamp */}
      {lastUpdated && (
        <div className="text-xs text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString('en-US')}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Goals"
          value={stats?.goals.active || 0}
          suffix="Active"
          icon="🎯"
          trend={stats?.goals.overdue ? 'down' : 'stable'}
          trendValue={
            stats?.goals.overdue ? `${stats.goals.overdue} Overdue` : undefined
          }
          onClick={() => navigate('/goals')}
          loading={loading}
        />
        <StatCard
          title="Tasks"
          value={stats?.tasks.pending || 0}
          suffix="Pending"
          icon="✅"
          onClick={() => navigate('/tasks')}
          loading={loading}
        />
        <StatCard
          title="Schedule"
          value={stats?.schedules.todayCount || 0}
          suffix="Today"
          icon="📅"
          onClick={() => navigate('/schedules')}
          loading={loading}
        />
        <StatCard
          title="Reminders"
          value={stats?.reminders.enabled || 0}
          suffix="Enabled"
          icon="⏰"
          onClick={() => navigate('/reminders')}
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions actions={quickActions} layout="horizontal" />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Goal Progress */}
          <GoalProgressList
            goals={activeGoals}
            loading={loading}
            onViewAll={() => navigate('/goals')}
            onGoalClick={() => navigate('/goals')}
            maxItems={5}
          />

          {/* Goal Status Chart */}
          {goalStatusData.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <span>📊</span>
                <span>Goal Status Distribution</span>
              </h3>
              <MiniPieChart
                data={goalStatusData}
                size={80}
                showLegend={true}
                innerRadius={0.5}
                loading={loading}
              />
            </div>
          )}

          {/* Today Tasks */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <span>✅</span>
                <span>Today's Tasks</span>
              </h3>
              <button
                onClick={() => navigate('/tasks')}
                className="text-sm text-primary hover:underline"
              >
                View All →
              </button>
            </div>
            {todayTasks.length > 0 ? (
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <div
                    key={task.uuid}
                    className="p-2 rounded-md border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate('/tasks')}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm line-clamp-1">
                        {task.displayTitle || task.title}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          task.importance === ImportanceLevel.Vital
                            ? 'bg-red-100 text-red-700'
                            : task.importance === ImportanceLevel.Important
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {task.importanceText || task.importance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-sm">No active tasks today</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Today Schedule */}
          <TodaySchedule
            schedules={todaySchedules}
            loading={loading}
            onViewAll={() => navigate('/schedules')}
            onScheduleClick={() => navigate('/schedules')}
            maxItems={5}
          />

          {/* Upcoming Reminders */}
          <UpcomingReminders
            reminders={upcomingReminders}
            loading={loading}
            onViewAll={() => navigate('/reminders')}
            onReminderClick={() => navigate('/reminders')}
            maxItems={5}
          />

          {/* Task Status Chart */}
          {taskStatusData.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <span>📈</span>
                <span>Task Status Distribution</span>
              </h3>
              <MiniPieChart
                data={taskStatusData}
                size={80}
                showLegend={true}
                innerRadius={0.5}
                loading={loading}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        <p>DailyUse Desktop - Built with Electron + React + shadcn/ui</p>
      </div>
    </div>
  );
}

export default DashboardView;
