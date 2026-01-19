/**
 * Task Statistics Composable
 * 任务统计相关的组合式函数
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - Composable 负责协调 ApplicationService 和 Store
 * - Service 直接返回数据或抛出错误
 * - Composable 使用 try/catch 处理错误 + 全局通知
 */

import { ref, computed, readonly } from 'vue';
import { GetTaskStatistics } from '@dailyuse/application-client/task';
import { useTaskStore } from '../stores/taskStore';
import { useMessage } from '@dailyuse/ui-vuetify';

/**
 * 任务统计 Composable
 */
export function useTaskStatistics() {
  // ===== 服务和存储 =====
  const taskStore = useTaskStore();
  const { success, error: showError } = useMessage();

  // ===== 本地状态 =====
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // ===== 计算属性 - 本地统计 =====

  /**
   * 本地统计数据（从缓存计算，快速）
   * TODO: Implement local statistics calculation
   */
  const localStatistics = computed(() => {
    return null; // TODO: calculate from store
  });

  /**
   * 按目标分组的统计
   * TODO: Implement getStatisticsByGoal
   */
  const statisticsByGoal = computed(() => {
    return {};
  });

  /**
   * 按分类分组的统计
   * TODO: Implement getStatisticsByCategory
   */
  const statisticsByCategory = computed(() => {
    return {};
  });

  /**
   * 模板统计
   */
  const templateStatistics = computed(() => ({
    total: taskStore.getAllTaskTemplates.length,
    active: taskStore.getAllTaskTemplates.filter((t: any) => t.status === 'ACTIVE').length,
    paused: taskStore.getAllTaskTemplates.filter((t: any) => t.status === 'PAUSED').length,
    archived: taskStore.getAllTaskTemplates.filter((t: any) => t.status === 'ARCHIVED').length,
  }));

  /**
   * 实例统计
   */
  const instanceStatistics = computed(() => ({
    total: taskStore.getAllTaskInstances.length,
    pending: taskStore.getInstancesByStatus('PENDING').length,
    inProgress: taskStore.getInstancesByStatus('IN_PROGRESS').length,
    completed: taskStore.getInstancesByStatus('COMPLETED').length,
    skipped: taskStore.getInstancesByStatus('SKIPPED').length,
    expired: taskStore.getInstancesByStatus('EXPIRED').length,
    today: taskStore.getAllTaskInstances.length,
  }));

  /**
   * 完成率
   */
  const completionRate = computed(() => {
    const total = instanceStatistics.value.total;
    const completed = instanceStatistics.value.completed;
    return total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0;
  });

  // ===== API 统计方法 =====

  /**
   * 获取任务统计数据（从服务器）
   * TODO: Fix service method signature
   */
  async function fetchTaskStatistics(options?: {
    startDate?: string;
    endDate?: string;
    goalUuid?: string;
  }) {
    console.warn('fetchTaskStatistics not fully implemented');
    return null;
  }

  /**
   * 获取任务完成趋势
   * TODO: Implement getTaskCompletionTrend in service
   */
  async function fetchTaskCompletionTrend(options?: {
    startDate?: string;
    endDate?: string;
    goalUuid?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    console.warn('fetchTaskCompletionTrend not implemented');
    return null;
  }

  /**
   * 获取特定目标的本地统计
   * TODO: Implement calculateLocalStatistics in service
   */
  function getLocalStatisticsByGoal(goalUuid: string) {
    console.warn('getLocalStatisticsByGoal not implemented');
    return null;
  }

  /**
   * 获取今日统计
   */
  const todayStatistics = computed(() => {
    const todayTasks = taskStore.getAllTaskInstances;
    const completed = todayTasks.filter((t: any) => t.status === 'COMPLETED').length;
    const pending = todayTasks.filter((t: any) => t.status === 'PENDING').length;
    const total = todayTasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0;

    return {
      total,
      completed,
      pending,
      completionRate,
    };
  });

  /**
   * 获取本周统计
   */
  const weekStatistics = computed(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const weekTasks = taskStore.getAllTaskInstances.filter((task) => {
      // TODO: 需要正确的 scheduledDate 属性
      // if (!task.timeConfig?.scheduledDate) return false;
      // const scheduledDate = new Date(task.timeConfig.scheduledDate);
      // return scheduledDate >= startOfWeek && scheduledDate < endOfWeek;
      return false;
    });

    const completed = weekTasks.filter((t: any) => t.status === 'COMPLETED').length;
    const pending = weekTasks.filter((t: any) => t.status === 'PENDING').length;
    const total = weekTasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0;

    return {
      total,
      completed,
      pending,
      completionRate,
    };
  });

  /**
   * 获取本月统计
   */
  const monthStatistics = computed(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthTasks = taskStore.getAllTaskInstances.filter((task) => {
      // TODO: 需要正确的 scheduledDate 属性
      // if (!task.timeConfig?.scheduledDate) return false;
      // const scheduledDate = new Date(task.timeConfig.scheduledDate);
      // return scheduledDate >= startOfMonth && scheduledDate <= endOfMonth;
      return false;
    });

    const completed = monthTasks.filter((t: any) => t.status === 'COMPLETED').length;
    const pending = monthTasks.filter((t: any) => t.status === 'PENDING').length;
    const total = monthTasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0;

    return {
      total,
      completed,
      pending,
      completionRate,
    };
  });

  // ===== 工具方法 =====

  /**
   * 清除错误状态
   */
  function clearError() {
    error.value = null;
  }

  /**
   * 格式化完成率
   */
  function formatCompletionRate(rate: number): string {
    return `${rate.toFixed(2)}%`;
  }

  /**
   * 获取统计摘要（用于仪表板）
   */
  const statisticsSummary = computed(() => ({
    // 模板
    templates: {
      total: templateStatistics.value.total,
      active: templateStatistics.value.active,
      paused: templateStatistics.value.paused,
    },
    // 实例
    instances: {
      total: instanceStatistics.value.total,
      completed: instanceStatistics.value.completed,
      pending: instanceStatistics.value.pending,
    },
    // 今日
    today: {
      total: todayStatistics.value.total,
      completed: todayStatistics.value.completed,
      pending: todayStatistics.value.pending,
      completionRate: todayStatistics.value.completionRate,
    },
    // 完成率
    overallCompletionRate: completionRate.value,
  }));

  // ===== 返回接口 =====

  return {
    // 状态
    isLoading: readonly(isLoading),
    error: readonly(error),

    // 本地统计（快速）
    localStatistics: readonly(localStatistics),
    templateStatistics: readonly(templateStatistics),
    instanceStatistics: readonly(instanceStatistics),
    completionRate: readonly(completionRate),
    todayStatistics: readonly(todayStatistics),
    weekStatistics: readonly(weekStatistics),
    monthStatistics: readonly(monthStatistics),
    statisticsSummary: readonly(statisticsSummary),

    // 分组统计
    statisticsByGoal: readonly(statisticsByGoal),
    statisticsByCategory: readonly(statisticsByCategory),

    // API 方法（需要网络请求）
    fetchTaskStatistics,
    fetchTaskCompletionTrend,
    getLocalStatisticsByGoal,

    // 工具方法
    clearError,
    formatCompletionRate,
  };
}

/**
 * 轻量级统计数据访问
 * 只提供本地计算的统计，不调用 API
 */
export function useTaskStatisticsData() {
  const taskStore = useTaskStore();

  return {
    // 模板统计
    templateStatistics: computed(() => ({
      total: taskStore.getAllTaskTemplates.length,
      active: taskStore.getAllTaskTemplates.filter((t: any) => t.status === 'ACTIVE').length,
      paused: taskStore.getAllTaskTemplates.filter((t: any) => t.status === 'PAUSED').length,
      archived: taskStore.getAllTaskTemplates.filter((t: any) => t.status === 'ARCHIVED').length,
    })),

    // 实例统计
    instanceStatistics: computed(() => ({
      total: taskStore.getAllTaskInstances.length,
      pending: taskStore.getInstancesByStatus('PENDING').length,
      inProgress: taskStore.getInstancesByStatus('IN_PROGRESS').length,
      completed: taskStore.getInstancesByStatus('COMPLETED').length,
      skipped: taskStore.getInstancesByStatus('SKIPPED').length,
      expired: taskStore.getInstancesByStatus('EXPIRED').length,
      today: taskStore.getAllTaskInstances.length,
    })),

    // 完成率
    completionRate: computed(() => {
      const total = taskStore.getAllTaskInstances.length;
      const completed = taskStore.getInstancesByStatus('COMPLETED').length;
      return total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0;
    }),

    // 今日统计
    todayStatistics: computed(() => {
      const todayTasks = taskStore.getAllTaskInstances;
      const completed = todayTasks.filter((t: any) => t.status === 'COMPLETED').length;
      const pending = todayTasks.filter((t: any) => t.status === 'PENDING').length;
      const total = todayTasks.length;
      const rate = total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0;

      return {
        total,
        completed,
        pending,
        completionRate: rate,
      };
    }),
  };
}
