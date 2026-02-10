/**
 * Task Template Composable
 * 任务模板相关的组合式函数
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - Composable 负责协调 ApplicationService 和 Store
 * - Service 直接返回实体对象或抛出错误（不包装 ServiceResult）
 * - Composable 使用 try/catch 处理错误
 * - 数据流：API → Service(转换) → Composable(存储+通知) → Store → Component
 *
 * 📝 错误处理：
 * - axios 拦截器已处理 API 错误，success: false 会抛出 Error
 * - Composable 捕获错误并设置 error 状态 + 全局通知
 */

import { ref, computed, readonly } from 'vue';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  TaskTimeConfigClientDTO,
} from '@dailyuse/contracts/task';
import { TaskTemplate, TaskInstance, TaskStatistics } from '@dailyuse/task/domain-client';
import {
  CreateTaskTemplate,
  ListTaskTemplates,
  GetTaskTemplate,
  UpdateTaskTemplate,
  DeleteTaskTemplate,
  ActivateTaskTemplate,
  PauseTaskTemplate,
  ArchiveTaskTemplate,
} from '@dailyuse/task/application-client';
import { useTaskStore } from '../stores/taskStore';
import { useMessage } from '@dailyuse/ui-vuetify';

/**
 * 任务模板管理 Composable
 */
export function useTaskTemplate() {
  // ===== 服务和存储 =====
  const taskStore = useTaskStore();
  const { success, error: showError } = useMessage();

  // ===== 本地状态 =====
  const isOperating = ref(false);
  const operationError = ref<string | null>(null);

  // ===== 计算属性 - 数据访问 =====

  /**
   * 所有任务模板
   */
  const taskTemplates = computed(() => taskStore.getAllTaskTemplates);

  /**
   * 激活的任务模板
   */
  const activeTaskTemplates = computed(() =>
    taskStore.getAllTaskTemplates.filter((t) => t.status === 'ACTIVE'),
  );

  /**
   * 暂停的任务模板
   */
  const pausedTaskTemplates = computed(() =>
    taskStore.getAllTaskTemplates.filter((t) => t.status === 'PAUSED'),
  );

  /**
   * 归档的任务模板
   */
  const archivedTaskTemplates = computed(() =>
    taskStore.getAllTaskTemplates.filter((t) => t.status === 'ARCHIVED'),
  );

  /**
   * 按目标分组的模板
   */
  const taskTemplatesByGoal = computed(() => (goalUuid: string) => {
    return taskStore.getAllTaskTemplates.filter(
      (t) => t.goalBinding && t.goalBinding.goalUuid === goalUuid,
    );
  });

  /**
   * 按关键结果分组的模板
   */
  const taskTemplatesByKeyResult = computed(() => (keyResultUuid: string) => {
    return taskStore.getAllTaskTemplates.filter(
      (t) => t.goalBinding && t.goalBinding.keyResultUuid === keyResultUuid,
    );
  });

  /**
   * UI 状态
   */
  const isLoading = computed(() => taskStore.isLoading || isOperating.value);
  const error = computed(() => taskStore.error || operationError.value);

  // ===== 任务模板 CRUD 操作 =====

  /**
   * 创建任务模板
   */
  async function createTaskTemplate(request: any) {
    try {
      isOperating.value = true;
      operationError.value = null;
      taskStore.setLoading(true);

      // ✅ Service 直接返回实体对象
      const template = await new CreateTaskTemplate().execute(request);

      // ✅ Composable 负责存储到 Store
      taskStore.addTaskTemplate(template);
      taskStore.updateLastSyncTime();

      // ✅ 全局通知
      success('任务模板创建成功');

      return template;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建任务模板失败';
      operationError.value = errorMessage;
      taskStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      taskStore.setLoading(false);
    }
  }

  /**
   * 获取任务模板列表
   */
  async function fetchTaskTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    goalUuid?: string;
  }) {
    try {
      isOperating.value = true;
      operationError.value = null;
      taskStore.setLoading(true);

      // ✅ Service 直接返回实体对象数组
      const templates = await new ListTaskTemplates().execute(params);

      // ✅ Composable 负责存储到 Store
      taskStore.setTaskTemplates(templates);

      return templates;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取任务模板列表失败';
      operationError.value = errorMessage;
      taskStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      taskStore.setLoading(false);
    }
  }

  /**
   * 获取任务模板详情
   */
  async function fetchTaskTemplate(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;
      taskStore.setLoading(true);

      // 先从缓存获取
      const cached = taskStore.getTaskTemplateByUuid(uuid);
      if (cached) {
        return cached;
      }

      // ✅ Service 直接返回实体对象
      const template = await new GetTaskTemplate().execute(uuid);

      // ✅ Composable 负责存储到 Store
      taskStore.addTaskTemplate(template);

      return template;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取任务模板详情失败';
      operationError.value = errorMessage;
      taskStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      taskStore.setLoading(false);
    }
  }

  /**
   * 更新任务模板
   * @deprecated 后端不支持部分更新
   */
  async function updateTaskTemplate(_uuid: string, _request: any): Promise<never> {
    throw new Error('updateTaskTemplate is not supported - use specific update methods instead');
  }

  /**
   * 删除任务模板
   */
  async function deleteTaskTemplate(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;
      taskStore.setLoading(true);

      // ✅ Service 返回 void 或抛出错误
      await new DeleteTaskTemplate().execute(uuid);

      // ✅ Composable 负责从 Store 移除
      taskStore.removeTaskTemplate(uuid);

      // ✅ 全局通知
      success('任务模板已删除');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除任务模板失败';
      operationError.value = errorMessage;
      taskStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      taskStore.setLoading(false);
    }
  }

  // ===== 生命周期管理 =====

  /**
   * 激活任务模板
   */
  async function activateTaskTemplate(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;
      taskStore.setLoading(true);

      // ✅ Service 返回模板和生成的实例
      const { template, instances } = await new ActivateTaskTemplate().execute(uuid);

      // ✅ Composable 负责更新 Store
      taskStore.updateTaskTemplate(uuid, template);

      // 同步 instances 到 store
      if (instances.length > 0) {
        taskStore.setTaskInstances(instances);
      }

      taskStore.updateLastSyncTime();

      // ✅ 全局通知
      success(`🚀 任务模板已激活，生成 ${instances.length} 个任务实例`);

      return template;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '激活任务模板失败';
      operationError.value = errorMessage;
      taskStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      taskStore.setLoading(false);
    }
  }

  /**
   * 暂停任务模板
   */
  async function pauseTaskTemplate(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;
      taskStore.setLoading(true);

      // ✅ Service 直接返回实体对象
      const template = await new PauseTaskTemplate().execute(uuid);

      // ✅ Composable 负责更新 Store
      taskStore.updateTaskTemplate(uuid, template);

      // ✅ 全局通知
      success('任务模板已暂停');

      return template;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '暂停任务模板失败';
      operationError.value = errorMessage;
      taskStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      taskStore.setLoading(false);
    }
  }

  // ===== 查询方法 =====

  /**
   * 搜索任务模板
   * @deprecated 后端不支持搜索，请使用 fetchTaskTemplates 过滤
   */
  async function searchTaskTemplates(_params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<never> {
    throw new Error(
      'searchTaskTemplates is not supported - use fetchTaskTemplates with filters instead',
    );
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
    total: taskTemplates.value.length,
    active: activeTaskTemplates.value.length,
    paused: pausedTaskTemplates.value.length,
    archived: archivedTaskTemplates.value.length,
  }));

  // ===== 返回接口 =====

  return {
    // 状态
    isLoading: readonly(isLoading),
    error: readonly(error),
    statistics: readonly(statistics),

    // 数据
    taskTemplates: readonly(taskTemplates),
    activeTaskTemplates: readonly(activeTaskTemplates),
    pausedTaskTemplates: readonly(pausedTaskTemplates),
    archivedTaskTemplates: readonly(archivedTaskTemplates),
    taskTemplatesByGoal: readonly(taskTemplatesByGoal),
    taskTemplatesByKeyResult: readonly(taskTemplatesByKeyResult),

    // CRUD 操作
    createTaskTemplate,
    fetchTaskTemplates,
    fetchTaskTemplate,
    updateTaskTemplate,
    deleteTaskTemplate,

    // 生命周期管理
    activateTaskTemplate,
    pauseTaskTemplate,

    // 查询方法
    searchTaskTemplates,

    // 工具方法
    clearError,
  };
}

/**
 * 轻量级任务模板数据访问
 * 只提供数据访问，不执行网络操作
 */
export function useTaskTemplateData() {
  const taskStore = useTaskStore();

  return {
    // 状态
    isLoading: computed(() => taskStore.isLoading),
    error: computed(() => taskStore.error),

    // 数据访问
    taskTemplates: computed(() => taskStore.getAllTaskTemplates),
    activeTaskTemplates: computed(() =>
      taskStore.getAllTaskTemplates.filter((t) => t.status === 'ACTIVE'),
    ),
    pausedTaskTemplates: computed(() =>
      taskStore.getAllTaskTemplates.filter((t) => t.status === 'PAUSED'),
    ),
    archivedTaskTemplates: computed(() =>
      taskStore.getAllTaskTemplates.filter((t) => t.status === 'ARCHIVED'),
    ),

    // 查询方法
    getTaskTemplateByUuid: taskStore.getTaskTemplateByUuid.bind(taskStore),

    // 统计信息
    statistics: computed(() => ({
      total: taskStore.getAllTaskTemplates.length,
      active: taskStore.getAllTaskTemplates.filter((t) => t.status === 'ACTIVE').length,
      paused: taskStore.getAllTaskTemplates.filter((t) => t.status === 'PAUSED').length,
      archived: taskStore.getAllTaskTemplates.filter((t) => t.status === 'ARCHIVED').length,
    })),
  };
}
