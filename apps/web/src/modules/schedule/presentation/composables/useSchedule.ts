/**
 * useSchedule Composable
 * Schedule 模块的核心组合函数 - 严格参考 Repository 模块
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - Composable 负责协调 ApplicationService 和状态管理
 * - Service 直接返回 DTO 或抛出错误
 * - Composable 使用 try/catch 处理错误 + 显示通知
 */

import { ref, onMounted } from 'vue';
import { scheduleApplicationService as scheduleWebApplicationService } from '@dailyuse/schedule/application-client';
import { scheduleApplicationService as scheduleConflictApplicationService } from '@dailyuse/schedule/application-client';
import { SourceModule } from '@dailyuse/contracts/schedule';
import type {
  ScheduleStatisticsClientDTO,
  ModuleStatisticsClientDTO,
  ConflictDetectionResult,
  ScheduleClientDTO,
  CreateScheduleTaskRequest,
  CreateScheduleRequest,
  ResolveConflictRequest,
} from '@dailyuse/contracts/schedule';
import { ScheduleTask } from '@dailyuse/schedule/domain-client';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';

/**
 * Schedule 模块的核心组合函数
 * 提供任务和统计信息的状态管理
 */
export function useSchedule() {
  const { success: showSuccess, error: showError } = getGlobalMessage();
  // ===== 状态 =====
  const tasks = ref<ScheduleTask[]>([]);
  const statistics = ref<ScheduleStatisticsClientDTO | null>(null);
  const moduleStatistics = ref<Record<SourceModule, ModuleStatisticsClientDTO> | null>(null);
  const isLoading = ref(false);
  const isLoadingStats = ref(false);
  const error = ref<string | null>(null);

  // ===== 冲突检测状态 (Story 9.5) =====
  const conflicts = ref<ConflictDetectionResult | null>(null);
  const isDetectingConflicts = ref(false);
  const conflictError = ref<string | null>(null);

  const lastCreatedSchedule = ref<{
    schedule: ScheduleClientDTO;
    conflicts?: ConflictDetectionResult;
  } | null>(null);
  const isCreatingSchedule = ref(false);
  const createScheduleError = ref<string | null>(null);

  const resolvedConflict = ref<{
    schedule: ScheduleClientDTO;
    conflicts: ConflictDetectionResult;
    applied: {
      strategy: string;
      previousStartTime?: number;
      previousEndTime?: number;
      changes: string[];
    };
  } | null>(null);
  const isResolvingConflict = ref(false);
  const resolveConflictError = ref<string | null>(null);

  // ===== 任务管理方法 =====

  /**
   * 获取所有任务
   */
  async function fetchTasks() {
    try {
      isLoading.value = true;
      error.value = null;

      tasks.value = await scheduleWebApplicationService.getAllTasks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch schedule tasks';
      error.value = message;
      showError(message);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 根据模块获取任务
   */
  async function fetchTasksByModule(module: SourceModule) {
    try {
      isLoading.value = true;
      error.value = null;

      tasks.value = await scheduleWebApplicationService.getTasksByModule(module);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tasks by module';
      error.value = message;
      showError(message);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 创建任务
   */
  async function createTask(request: CreateScheduleTaskRequest): Promise<ScheduleTask> {
    try {
      isLoading.value = true;
      error.value = null;

      const newTask = await scheduleWebApplicationService.createTask(request);
      tasks.value.push(newTask);
      showSuccess('调度任务创建成功');
      return newTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create schedule task';
      error.value = message;
      showError(message);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 暂停任务
   */
  async function pauseTask(taskUuid: string) {
    try {
      await scheduleWebApplicationService.pauseTask(taskUuid);

      // 更新本地状态
      const index = tasks.value.findIndex((t) => t.uuid === taskUuid);
      if (index > -1) {
        const pausedTask = tasks.value[index].pause();
        tasks.value.splice(index, 1, pausedTask);
      }

      showSuccess('任务已暂停');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pause task';
      error.value = message;
      showError(message);
      throw err;
    }
  }

  /**
   * 恢复任务
   */
  async function resumeTask(taskUuid: string) {
    try {
      await scheduleWebApplicationService.resumeTask(taskUuid);

      // 更新本地状态
      const index = tasks.value.findIndex((t) => t.uuid === taskUuid);
      if (index > -1) {
        const resumedTask = tasks.value[index].resume();
        tasks.value.splice(index, 1, resumedTask);
      }

      showSuccess('任务已恢复');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume task';
      error.value = message;
      showError(message);
      throw err;
    }
  }

  /**
   * 删除任务
   */
  async function deleteTask(taskUuid: string) {
    try {
      await scheduleWebApplicationService.deleteTask(taskUuid);

      // 从本地列表移除
      const index = tasks.value.findIndex((t) => t.uuid === taskUuid);
      if (index > -1) {
        tasks.value.splice(index, 1);
      }

      showSuccess('任务已删除');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      error.value = message;
      showError(message);
      throw err;
    }
  }

  // ===== 冲突检测方法 (Story 9.5) =====

  /**
   * 检测日程冲突
   *
   * @param userId 用户ID
   * @param startTime 开始时间（Unix毫秒时间戳）
   * @param endTime 结束时间（Unix毫秒时间戳）
   * @param excludeUuid 可选：排除的日程UUID（编辑场景）
   */
  async function detectConflicts(
    userId: string,
    startTime: number,
    endTime: number,
    excludeUuid?: string,
  ) {
    try {
      isDetectingConflicts.value = true;
      conflictError.value = null;

      const result = await scheduleConflictApplicationService.detectConflicts({
        userId,
        startTime,
        endTime,
        excludeUuid,
      });

      conflicts.value = result;
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to detect conflicts';
      conflictError.value = message;
      showError(message);
      throw err;
    } finally {
      isDetectingConflicts.value = false;
    }
  }

  /**
   * 创建日程（带冲突检测）
   *
   * @param request 创建日程请求
   */
  async function createSchedule(request: CreateScheduleRequest) {
    try {
      isCreatingSchedule.value = true;
      createScheduleError.value = null;

      const result = await scheduleConflictApplicationService.createSchedule(request);
      lastCreatedSchedule.value = result;

      showSuccess('日程创建成功');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create schedule';
      createScheduleError.value = message;
      showError(message);
      throw err;
    } finally {
      isCreatingSchedule.value = false;
    }
  }

  /**
   * 解决日程冲突
   *
   * @param scheduleUuid 日程UUID
   * @param request 解决冲突请求
   */
  async function resolveConflict(scheduleUuid: string, request: ResolveConflictRequest) {
    try {
      isResolvingConflict.value = true;
      resolveConflictError.value = null;

      const result = await scheduleConflictApplicationService.resolveConflict(
        scheduleUuid,
        request,
      );
      resolvedConflict.value = result;

      showSuccess('冲突已解决');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resolve conflict';
      resolveConflictError.value = message;
      showError(message);
      throw err;
    } finally {
      isResolvingConflict.value = false;
    }
  }

  // ===== 统计信息方法 =====

  /**
   * 获取统计信息
   */
  async function fetchStatistics() {
    try {
      isLoadingStats.value = true;
      error.value = null;

      statistics.value = await scheduleWebApplicationService.getStatistics();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch statistics';
      error.value = message;
      showError(message);
    } finally {
      isLoadingStats.value = false;
    }
  }

  /**
   * 获取所有模块统计
   */
  async function fetchAllModuleStatistics() {
    try {
      isLoadingStats.value = true;
      error.value = null;

      moduleStatistics.value = await scheduleWebApplicationService.getAllModuleStatistics();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch module statistics';
      error.value = message;
      showError(message);
    } finally {
      isLoadingStats.value = false;
    }
  }

  /**
   * 重新计算统计信息
   */
  async function recalculateStatistics() {
    try {
      isLoadingStats.value = true;
      error.value = null;

      statistics.value = await scheduleWebApplicationService.recalculateStatistics();
      showSuccess('统计信息已重新计算');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to recalculate statistics';
      error.value = message;
      showError(message);
      throw err;
    } finally {
      isLoadingStats.value = false;
    }
  }

  // ===== 初始化和刷新 =====

  /**
   * 初始化 - 加载任务和统计信息
   */
  async function initialize() {
    await Promise.all([fetchTasks(), fetchStatistics(), fetchAllModuleStatistics()]);
  }

  /**
   * 刷新所有数据
   */
  async function refresh() {
    await initialize();
  }

  /**
   * 清除错误
   */
  function clearError() {
    error.value = null;
  }

  // ===== 生命周期 =====
  onMounted(() => {
    // 组件挂载时不自动加载，由页面控制
  });

  return {
    // 状态
    tasks,
    statistics,
    moduleStatistics,
    isLoading,
    isLoadingStats,
    error,

    // 任务方法
    fetchTasks,
    fetchTasksByModule,
    createTask,
    pauseTask,
    resumeTask,
    deleteTask,

    // 统计方法
    fetchStatistics,
    fetchAllModuleStatistics,
    recalculateStatistics,

    // 工具方法
    initialize,
    refresh,
    clearError,

    // ===== 冲突检测 (Story 9.5) =====

    // Conflict detection state & methods
    conflicts,
    isDetectingConflicts,
    conflictError,
    detectConflicts,

    // Create schedule state & methods
    lastCreatedSchedule,
    isCreatingSchedule,
    createScheduleError,
    createSchedule,

    // Resolve conflict state & methods
    resolvedConflict,
    isResolvingConflict,
    resolveConflictError,
    resolveConflict,
  };
}
