/**
 * Task Module - Renderer
 *
 * 任务模块 - 渲染进程
 * 遵循 DDD 分层架构
 */

// ===== Application Layer =====
export { TaskApplicationService, taskApplicationService } from '@dailyuse/application-client/task';

// ===== Presentation Layer =====
// Hooks
export {
  useTaskTemplate,
  useTaskInstance,
  useTaskStatistics,
  type UseTaskTemplateReturn,
  type UseTaskInstanceReturn,
  type TaskStatisticsState,
  type UseTaskStatisticsReturn,
} from './presentation/hooks';

// ===== Initialization =====
export { registerTaskModule, initializeTaskModule } from './initialization';

// ===== Combined Hook (便捷导出) =====

// 兼容性类型导出
export interface TaskState {
  templates: unknown[];
  instances: unknown[];
  loading: boolean;
  error: string | null;
}

export interface UseTaskReturn extends TaskState {
  loadTasks: () => Promise<void>;
}

/**
 * useTask - 组合 Hook
 *
 * 使用 useTaskTemplate 和 useTaskInstance 的组合
 */
export function useTask(): UseTaskReturn {
  // 推荐直接使用 useTaskTemplate 和 useTaskInstance
  return {
    templates: [],
    instances: [],
    loading: false,
    error: null,
    loadTasks: async () => {},
  };
}
