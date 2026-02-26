/**
 * useDashboard - Dashboard composable
 *
 * Fetches aggregated dashboard statistics from a single endpoint.
 * Uses ResultHttpClient directly (no domain service needed for read-only aggregation).
 */

import { ref, computed } from 'vue';
import { HTTP_CLIENT_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';

// ── Types ──

export interface DashboardStats {
  activeTasks: number;
  completedToday: number;
  activeGoals: number;
  upcomingReminders: number;
  unreadNotifications: number;
  scheduleConflicts: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: number;
}

export interface TrendDay {
  date: string;
  tasksCompleted: number;
  tasksCreated: number;
  focusMinutes: number;
}

export interface GoalProgressItem {
  id: string;
  name: string;
  progress: number;
  status: string;
  dueDate: number;
  keyResultCount: number;
}

export interface TaskBoardSummary {
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}

export interface ScheduleItem {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  priority: number;
}

export interface DashboardData {
  stats: DashboardStats;
  activityTimeline: ActivityItem[];
  trendDays: TrendDay[];
  goalProgress: GoalProgressItem[];
  taskBoard: TaskBoardSummary;
  upcomingSchedule: ScheduleItem[];
}

// ── Default empty state ──

const emptyData: DashboardData = {
  stats: {
    activeTasks: 0,
    completedToday: 0,
    activeGoals: 0,
    upcomingReminders: 0,
    unreadNotifications: 0,
    scheduleConflicts: 0,
  },
  activityTimeline: [],
  trendDays: [],
  goalProgress: [],
  taskBoard: { todo: 0, inProgress: 0, done: 0, overdue: 0 },
  upcomingSchedule: [],
};

// ── Composable ──

export function useDashboard() {
  const http = useStrictInject(HTTP_CLIENT_KEY, 'HttpClient');

  const data = ref<DashboardData>({ ...emptyData });
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const stats = computed(() => data.value.stats);
  const activityTimeline = computed(() => data.value.activityTimeline);
  const trendDays = computed(() => data.value.trendDays);
  const goalProgress = computed(() => data.value.goalProgress);
  const taskBoard = computed(() => data.value.taskBoard);
  const upcomingSchedule = computed(() => data.value.upcomingSchedule);

  async function fetchDashboard() {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await http.get<DashboardData>('/dashboard/stats');
      if (result.ok) {
        data.value = {
          stats: result.data.stats ?? emptyData.stats,
          activityTimeline: result.data.activityTimeline ?? [],
          trendDays: result.data.trendDays ?? [],
          goalProgress: result.data.goalProgress ?? [],
          taskBoard: result.data.taskBoard ?? emptyData.taskBoard,
          upcomingSchedule: result.data.upcomingSchedule ?? [],
        };
      } else {
        error.value = result.error.message || '加载仪表盘数据失败';
        console.error('[dashboard]', error.value);
      }
    } finally {
      isLoading.value = false;
    }
  }

  return {
    data,
    stats,
    activityTimeline,
    trendDays,
    goalProgress,
    taskBoard,
    upcomingSchedule,
    isLoading,
    error,
    fetchDashboard,
  };
}
