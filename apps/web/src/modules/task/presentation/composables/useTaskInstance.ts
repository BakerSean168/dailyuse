/**
 * Task Instance Composable
 * 任务实例相关的组合式函数
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - Composable 负责协调 ApplicationService 和 Store
 * - Service 直接返回实体对象或抛出错误（不包装 ServiceResult）
 * - Composable 使用 try/catch 处理错误
 * - 数据流：API → Service(转换) → Composable(存储) → Store → Component
 *
 * 📝 错误处理：
 * - axios 拦截器已处理 API 错误，success: false 会抛出 Error
 * - Composable 捕获错误并设置 error 状态
 */

import { ref, computed, readonly } from 'vue';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  TaskTimeConfigClientDTO,
} from '@dailyuse/contracts/task';
import { TaskTemplate, TaskInstance, TaskStatistics } from '@dailyuse/task/domain-client';
import {
  ListTaskInstances,
  GetTaskInstance,
  StartTaskInstance,
  CompleteTaskInstance,
  SkipTaskInstance,
  DeleteTaskInstance,
} from '@dailyuse/task/application-client';
import { useTaskStore } from '../stores/taskStore';
import { useMessage } from '@dailyuse/ui-vuetify';

/**
 * 任务实例管理 Composable
 */
export function useTaskInstance() {
  // ===== 服务和存储 =====
  const taskStore = useTaskStore();
  const { success, error: showError } = useMessage();

  // ===== 本地状态 =====
  const isOperating = ref(false);
  const operationError = ref<string | null>(null);

  // ===== 计算属性 - 数据访问 =====

  /**
   * 所有任务实例
   */
  const taskInstances = computed(() => taskStore.getAllTaskInstances);

  /**
   * 待处理的任务实例
   */
  const pendingTaskInstances = computed(() => taskStore.getInstancesByStatus('PENDING'));

  /**
   * 进行中的任务实例
   */
  const inProgressTaskInstances = computed(() => taskStore.getInstancesByStatus('IN_PROGRESS'));

  /**
   * 已完成的任务实例
   */
  const completedTaskInstances = computed(() => taskStore.getInstancesByStatus('COMPLETED'));

  /**
   * 已跳过的任务实例
   */
  const skippedTaskInstances = computed(() => taskStore.getInstancesByStatus('SKIPPED'));

  /**
   * 已过期的任务实例
   */
  const expiredTaskInstances = computed(() => taskStore.getInstancesByStatus('EXPIRED'));

  /**
   * 今日任务
   * TODO: Implement getTodayTaskInstances in store or calculate here
   */
  const todayTaskInstances = computed(() => []);

  /**
   * 本周任务
   */
  const thisWeekTaskInstances = computed(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return taskStore.getAllTaskInstances.filter((task) => {
      // TODO: 需要正确的 scheduledDate 属性
      // if (!task.timeConfig?.scheduledDate) return false;
      // const scheduledDate = new Date(task.timeConfig.scheduledDate);
      // return scheduledDate >= startOfWeek && scheduledDate < endOfWeek;
      return false;
    });
  });

  /**
   * 按模板分组的实例
   */
  const taskInstancesByTemplate = computed(() => (templateUuid: string) => {
    return taskStore.getInstancesByTemplateUuid(templateUuid);
  });

  /**
   * UI 状态
   */
  const isLoading = computed(() => taskStore.isLoading || isOperating.value);
  const error = computed(() => taskStore.error || operationError.value);

  // ===== 任务实例 CRUD 操作 =====

  /**
   * 创建任务实例
   * @deprecated 后端不支持直接创建实例
   */
  async function createTaskInstance(_request: any): Promise<never> {
    throw new Error(
      'createTaskInstance is not supported - use TaskTemplate.generateInstances instead',
    );
  }

  /**
   * 获取任务实例详情
   */
  async function fetchTaskInstance(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;
      taskStore.setLoading(true);

      // 先从缓存获取
      const cached = taskStore.getTaskInstanceByUuid(uuid);
      if (cached) {
        return cached;
      }

      // 缓存中没有，从服务器获取
      // ✅ Service 直接返回实体对象或抛出错误
      const instance = await new GetTaskInstance().execute(uuid);

      // ✅ Composable 负责存储到 Store
      taskStore.addTaskInstance(instance);

      return instance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取任务实例详情失败';
      operationError.value = errorMessage;
      taskStore.setError(errorMessage);
      // ✅ 全局通知
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      taskStore.setLoading(false);
    }
  }

  /**
   * 更新任务实例
   * @deprecated 后端不支持更新实例
   */
  async function updateTaskInstance(_uuid: string, _request: any): Promise<never> {
    throw new Error(
      'updateTaskInstance is not supported - use start/complete/skip methods instead',
    );
  }

  /**
   * 删除任务实例
   */
  async function deleteTaskInstance(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;
      taskStore.setLoading(true);

      // ✅ Service 返回 void 或抛出错误
      await new DeleteTaskInstance().execute(uuid);

      // ✅ Composable 负责从 Store 移除
      taskStore.removeTaskInstance(uuid);

      // ✅ 全局通知
      success('任务实例已删除');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除任务实例失败';
      operationError.value = errorMessage;
      taskStore.setError(errorMessage);
      // ✅ 全局通知
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      taskStore.setLoading(false);
    }
  }

  // ===== 状态管理操作 =====

  /**
   * 完成任务
   */
  async function completeTaskInstance(
    uuid: string,
    resultData?: {
      recordValue?: number;
      duration?: number;
      note?: string;
      rating?: number;
    },
  ) {
    try {
      isOperating.value = true;
      operationError.value = null;
      taskStore.setLoading(true);

      // ✅ Service 直接返回实体对象或抛出错误
      const instance = await new CompleteTaskInstance().execute(uuid, resultData);

      // ✅ Composable 负责更新 Store
      taskStore.updateTaskInstance(uuid, instance);

      // ✅ 全局通知
      success('🎉 任务已完成');

      return instance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '完成任务失败';
      operationError.value = errorMessage;
      taskStore.setError(errorMessage);
      // ✅ 全局通知
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      taskStore.setLoading(false);
    }
  }

  /**
   * 撤销完成任务
   * @deprecated 后端不支持撤销完成
   */
  async function undoCompleteTaskInstance(_uuid: string): Promise<never> {
    throw new Error('undoCompleteTaskInstance is not supported');
  }

  /**
   * 重新安排任务
   * @deprecated 后端不支持重新安排
   */
  async function rescheduleTaskInstance(_uuid: string, _request: any): Promise<never> {
    throw new Error('rescheduleTaskInstance is not supported');
  }

  /**
   * 取消任务
   * @deprecated 后端不支持取消，请使用 skipTaskInstance
   */
  async function cancelTaskInstance(_uuid: string, _reason?: string): Promise<never> {
    throw new Error('cancelTaskInstance is not supported - use skipTaskInstance instead');
  }

  // ===== 查询方法 =====

  /**
   * 搜索任务实例
   * TODO: Implement searchTaskInstances with proper API
   */
  async function searchTaskInstances(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
  }) {
    console.warn('searchTaskInstances not implemented');
    return [];
  }

  /**
   * 获取今日任务
   * TODO: Implement getTodayTasks in service
   */
  async function getTodayTasks() {
    console.warn('getTodayTasks not implemented');
    return [];
  }

  /**
   * 获取即将到来的任务
   * TODO: Implement getUpcomingTasks in service
   */
  async function getUpcomingTasks(days = 7) {
    console.warn('getUpcomingTasks not implemented');
    return [];
  }

  /**
   * 获取逾期任务
   * TODO: Implement getOverdueTasks in service
   */
  async function getOverdueTasks() {
    console.warn('getOverdueTasks not implemented');
    return [];
  }

  // ===== 工具方法 =====

  /**
   * 清除错误状态
   */
  function clearError() {
    operationError.value = null;
    taskStore.setError(null);
  }

  /**
   * 统计信息
   */
  const statistics = computed(() => ({
    total: taskInstances.value.length,
    pending: pendingTaskInstances.value.length,
    inProgress: inProgressTaskInstances.value.length,
    completed: completedTaskInstances.value.length,
    skipped: skippedTaskInstances.value.length,
    expired: expiredTaskInstances.value.length,
    today: todayTaskInstances.value.length,
    thisWeek: thisWeekTaskInstances.value.length,
  }));

  // ===== 返回接口 =====

  return {
    // 状态
    isLoading: readonly(isLoading),
    error: readonly(error),
    statistics: readonly(statistics),

    // 数据
    taskInstances: readonly(taskInstances),
    pendingTaskInstances: readonly(pendingTaskInstances),
    inProgressTaskInstances: readonly(inProgressTaskInstances),
    completedTaskInstances: readonly(completedTaskInstances),
    skippedTaskInstances: readonly(skippedTaskInstances),
    expiredTaskInstances: readonly(expiredTaskInstances),
    todayTaskInstances: readonly(todayTaskInstances),
    thisWeekTaskInstances: readonly(thisWeekTaskInstances),
    taskInstancesByTemplate: readonly(taskInstancesByTemplate),

    // CRUD 操作
    createTaskInstance,
    fetchTaskInstance,
    updateTaskInstance,
    deleteTaskInstance,

    // 状态管理
    completeTaskInstance,
    undoCompleteTaskInstance,
    rescheduleTaskInstance,
    cancelTaskInstance,

    // 查询方法
    searchTaskInstances,
    getTodayTasks,
    getUpcomingTasks,
    getOverdueTasks,

    // 工具方法
    clearError,
  };
}

/**
 * 轻量级任务实例数据访问
 * 只提供数据访问，不执行网络操作
 */
export function useTaskInstanceData() {
  const taskStore = useTaskStore();
  const todayTaskInstances = computed(() => []); // TODO: filter by today

  return {
    // 状态
    isLoading: computed(() => taskStore.isLoading),
    error: computed(() => taskStore.error),

    // 数据访问
    taskInstances: computed(() => taskStore.getAllTaskInstances),
    pendingTaskInstances: computed(() => taskStore.getInstancesByStatus('PENDING')),
    inProgressTaskInstances: computed(() => taskStore.getInstancesByStatus('IN_PROGRESS')),
    completedTaskInstances: computed(() => taskStore.getInstancesByStatus('COMPLETED')),
    skippedTaskInstances: computed(() => taskStore.getInstancesByStatus('SKIPPED')),
    expiredTaskInstances: computed(() => taskStore.getInstancesByStatus('EXPIRED')),
    todayTaskInstances,

    // 查询方法
    getTaskInstanceByUuid: taskStore.getTaskInstanceByUuid.bind(taskStore),
    getInstancesByTemplateUuid: taskStore.getInstancesByTemplateUuid.bind(taskStore),

    // 统计信息
    statistics: computed(() => ({
      total: taskStore.getAllTaskInstances.length,
      pending: taskStore.getInstancesByStatus('PENDING').length,
      inProgress: taskStore.getInstancesByStatus('IN_PROGRESS').length,
      completed: taskStore.getInstancesByStatus('COMPLETED').length,
      skipped: taskStore.getInstancesByStatus('SKIPPED').length,
      expired: taskStore.getInstancesByStatus('EXPIRED').length,
      today: 0, // TODO: calculate from today's date
    })),
  };
}
