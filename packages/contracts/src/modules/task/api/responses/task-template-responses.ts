/**
 * Task Template Responses
 * 任务模板响应类型定义
 */

import type {
  TaskTemplateServerDTO,
  TaskTemplateClientDTO,
  TaskInstanceServerDTO,
  TaskInstanceClientDTO,
  TaskDependencyServerDTO,
  TaskDependencyClientDTO,
} from '../../aggregates';
import type {
  TaskTemplateHistoryServerDTO,
  TaskTemplateHistoryClientDTO,
} from '../../entities';

/**
 * 任务模板响应
 */
export interface TaskTemplateResponse {
  template: TaskTemplateServerDTO | TaskTemplateClientDTO;
}

/**
 * 任务模板列表响应
 */
export interface TaskTemplatesResponse {
  templates: (TaskTemplateServerDTO | TaskTemplateClientDTO)[];
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * 任务模板历史响应
 */
export interface TaskTemplateHistoryResponse {
  history: (TaskTemplateHistoryServerDTO | TaskTemplateHistoryClientDTO)[];
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * 任务模板聚合视图响应
 * 包含模板及其所有关联实体的完整视图
 */
export interface TaskTemplateAggregateViewResponse {
  template: TaskTemplateServerDTO | TaskTemplateClientDTO;
  instances?: (TaskInstanceServerDTO | TaskInstanceClientDTO)[];
  history?: (TaskTemplateHistoryServerDTO | TaskTemplateHistoryClientDTO)[];
  dependencies?: (TaskDependencyServerDTO | TaskDependencyClientDTO)[];
  statistics?: {
    totalInstances: number;
    completedInstances: number;
    pendingInstances: number;
    skippedInstances: number;
    expiredInstances: number;
    completionRate: number;
    averageDuration: number;
    averageRating: number;
  };
}

/**
 * 任务仪表板响应
 */
export interface TaskDashboardResponse {
  todayTasks: TaskTemplateServerDTO[];
  overdueTasks: TaskTemplateServerDTO[];
  upcomingTasks: TaskTemplateServerDTO[];
  highPriorityTasks: TaskTemplateServerDTO[];
  blockedTasks: TaskTemplateServerDTO[];
  summary: {
    totalTasks: number;
    completedToday: number;
    overdue: number;
    upcoming: number;
    highPriority: number;
  };
}
