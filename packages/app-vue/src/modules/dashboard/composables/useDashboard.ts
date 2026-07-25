/**
 * useDashboard - Dashboard composable
 *
 * Fetches aggregated dashboard statistics via DASHBOARD_SERVICE_KEY.
 * Transport-agnostic: works with both HTTP (web) and IPC (desktop) adapters.
 *
 * Residual 1059: createComposableHandleError console report path
 * (local ref error + console dual retired onto sole).
 */

import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { DASHBOARD_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type { DashboardData } from '@dailyuse/contracts/dashboard';
import { createComposableHandleError } from '../../../shared/utils/create-composable-handle-error';

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
  const dashboardService = useStrictInject(DASHBOARD_SERVICE_KEY, 'DashboardService');
  const { t } = useI18n();

  const data = ref<DashboardData>({ ...emptyData });
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const stats = computed(() => data.value.stats);
  const activityTimeline = computed(() => data.value.activityTimeline);
  const trendDays = computed(() => data.value.trendDays);
  const goalProgress = computed(() => data.value.goalProgress);
  const taskBoard = computed(() => data.value.taskBoard);
  const upcomingSchedule = computed(() => data.value.upcomingSchedule);

  const handleError = createComposableHandleError({
    t,
    setError: (message) => {
      error.value = message;
    },
  });

  async function fetchDashboard() {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await dashboardService.getDashboardStats();
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
        handleError(result.error, 'dashboard.error.loadFailed');
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
