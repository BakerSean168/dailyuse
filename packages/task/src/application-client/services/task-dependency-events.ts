/**
 * Task Dependency Events
 *
 * 任务依赖关系事件常量
 */

export const TaskDependencyEvents = {
  DEPENDENCY_CREATED: 'task:dependency:created',
  DEPENDENCY_UPDATED: 'task:dependency:updated',
  DEPENDENCY_DELETED: 'task:dependency:deleted',
} as const;

export interface TaskDependencyRefreshEvent {
  dependencyUuid?: string;
  taskUuid: string;
  reason: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
