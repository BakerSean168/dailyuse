/**
 * Task Module API Requests
 * 任务模块 API 请求/响应类型定义
 */

import type {
  TaskTemplateServerDTO,
  TaskTemplateClientDTO,
  TaskInstanceServerDTO,
  TaskInstanceClientDTO,
  TaskDependencyServerDTO,
  TaskDependencyClientDTO,
  TaskStatisticsServerDTO,
  TaskStatisticsClientDTO,
} from './aggregates';
import type {
  TaskTemplateHistoryServerDTO,
  TaskTemplateHistoryClientDTO,
} from './entities';
import type {
  TaskTimeConfigServerDTO,
  RecurrenceRuleServerDTO,
  TaskReminderConfigServerDTO,
  TaskGoalBindingServerDTO,
} from './value-objects';
import type {
  TaskType,
  TaskTemplateStatus,
  TaskInstanceStatus,
  DependencyType,
} from './enums';
import type { ImportanceLevel } from '../../shared/index';
import type { BatchOperationResponseDTO } from '../../shared/dtos';

// ============ TaskTemplate 请求/响应 ============

/**
 * 创建任务模板请求
 * Story 2.3: urgency 已移除 - Priority 由后端根据 importance 和 dueDate 自动计算
 */
export interface CreateTaskTemplateRequest {
  accountUuid: string;
  name: string;
  description?: string;
  taskType: TaskType;
  timeConfig: TaskTimeConfigServerDTO;
  recurrenceRule?: RecurrenceRuleServerDTO;
  reminderConfig?: TaskReminderConfigServerDTO;
  importance: ImportanceLevel;
  goalBinding?: TaskGoalBindingServerDTO;
  folderUuid?: string;
  tags?: string[];
  color?: string;
  generateAheadDays?: number;
}

/**
 * 更新任务模板请求
 * Story 2.3: urgency 已移除 - Priority 由后端根据 importance 和 dueDate 自动计算
 */
export interface UpdateTaskTemplateRequest {
  name?: string;
  description?: string;
  timeConfig?: TaskTimeConfigServerDTO;
  recurrenceRule?: RecurrenceRuleServerDTO;
  reminderConfig?: TaskReminderConfigServerDTO;
  importance?: ImportanceLevel;
  folderUuid?: string;
  tags?: string[];
  color?: string;
  generateAheadDays?: number;
}

/**
 * 查询任务模板请求
 * Story 2.3: urgency 查询参数已移除
 */
export interface QueryTaskTemplatesRequest {
  accountUuid: string;
  status?: TaskTemplateStatus[];
  taskType?: TaskType[];
  importance?: ImportanceLevel[];
  folderUuid?: string;
  goalUuid?: string;
  tags?: string[];
  keyword?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  includeInstances?: boolean;
  includeHistory?: boolean;
}

/**
 * 生成任务实例请求
 */
export interface GenerateInstancesRequest {
  templateUuid: string;
  toDate: number; // 生成到哪个日期（时间戳）
}

/**
 * 绑定到目标请求
 */
export interface BindToGoalRequest {
  goalUuid: string;
  keyResultUuid?: string;
  incrementValue?: number;
}

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

// ============ TaskInstance 请求/响应 ============

/**
 * 创建任务实例请求（通常由系统自动生成，不需要手动创建）
 */
export interface CreateTaskInstanceRequest {
  templateUuid: string;
  accountUuid: string;
  name: string;
  description?: string;
  scheduledStartTime: number;
  scheduledEndTime: number;
  reminderTime?: number;
  tags?: string[];
}

/**
 * 更新任务实例请求
 */
export interface UpdateTaskInstanceRequest {
  name?: string;
  description?: string;
  scheduledStartTime?: number;
  scheduledEndTime?: number;
  reminderTime?: number;
  tags?: string[];
}

/**
 * 查询任务实例请求
 */
export interface QueryTaskInstancesRequest {
  accountUuid: string;
  templateUuid?: string;
  status?: TaskInstanceStatus[];
  startDate?: number;
  endDate?: number;
  tags?: string[];
  keyword?: string;
  sortBy?: 'scheduledStartTime' | 'createdAt' | 'completedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * 完成任务实例请求
 */
export interface CompleteTaskInstanceRequest {
  recordValue?: number; // Goal Record 的值（如果任务绑定了 KeyResult）
  duration?: number; // 实际耗时（分钟）
  note?: string; // 完成备注
  rating?: number; // 满意度评分（1-5）
}

/**
 * 跳过任务实例请求
 */
export interface SkipTaskInstanceRequest {
  reason?: string; // 跳过原因
}

/**
 * 任务实例响应
 */
export interface TaskInstanceResponse {
  instance: TaskInstanceServerDTO | TaskInstanceClientDTO;
}

/**
 * 任务实例列表响应
 */
export interface TaskInstancesResponse {
  instances: (TaskInstanceServerDTO | TaskInstanceClientDTO)[];
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * 检查过期实例响应
 */
export interface CheckExpiredInstancesResponse {
  count: number;
  instances: (TaskInstanceServerDTO | TaskInstanceClientDTO)[];
}

// ============ TaskDependency 请求/响应 ============
// 注意：CreateTaskDependencyRequest、UpdateTaskDependencyRequest、ValidateDependencyRequest
// 已在 TaskDependencyClient.ts 中定义，这里不重复定义

/**
 * 获取依赖链请求
 */
export interface GetDependencyChainRequest {
  taskUuid: string;
  maxDepth?: number; // 最大深度（防止循环依赖导致无限查询）
}

/**
 * 任务依赖响应
 */
export interface TaskDependencyResponse {
  dependency: TaskDependencyServerDTO | TaskDependencyClientDTO;
}

/**
 * 任务依赖列表响应
 */
export interface TaskDependenciesResponse {
  dependencies: (TaskDependencyServerDTO | TaskDependencyClientDTO)[];
  total: number;
}

/**
 * 依赖链响应
 */
export interface DependencyChainResponse {
  chain: Array<{
    task: TaskTemplateServerDTO | TaskTemplateClientDTO;
    dependencies: (TaskDependencyServerDTO | TaskDependencyClientDTO)[];
    level: number; // 层级（0 表示根任务）
  }>;
}

// 注意：ValidateDependencyResponse 已在 TaskDependencyClient.ts 中定义

// ============ TaskStatistics 请求/响应 ============

/**
 * 获取任务统计请求
 */
export interface GetTaskStatisticsRequest {
  accountUuid: string;
  forceRecalculate?: boolean;
}

/**
 * 任务统计响应
 */
export interface TaskStatisticsResponse {
  statistics: TaskStatisticsServerDTO | TaskStatisticsClientDTO;
}

/**
 * 重新计算统计请求
 */
export interface RecalculateTaskStatisticsRequest {
  accountUuid: string;
  force?: boolean; // 是否强制重算（即使已存在）
}

/**
 * 重新计算统计响应
 */
export interface RecalculateTaskStatisticsResponse {
  ok: boolean;
  message: string;
  statistics: TaskStatisticsServerDTO;
}

// ============ 批量操作 ============

/**
 * 批量更新任务模板状态请求
 */
export interface BatchUpdateTemplateStatusRequest {
  templateUuids: string[];
  status: TaskTemplateStatus;
}

/**
 * 批量删除任务模板请求
 */
export interface BatchDeleteTemplatesRequest {
  templateUuids: string[];
  hardDelete?: boolean;
}

/**
 * 批量移动任务模板请求
 */
export interface BatchMoveTemplatesRequest {
  templateUuids: string[];
  targetFolderUuid: string;
}

/**
 * 批量完成任务实例请求
 */
export interface BatchCompleteInstancesRequest {
  instanceUuids: string[];
  note?: string;
}

/**
 * 批量跳过任务实例请求
 */
export interface BatchSkipInstancesRequest {
  instanceUuids: string[];
  reason?: string;
}

/**
 * 批量删除任务实例请求
 */
export interface BatchDeleteInstancesRequest {
  instanceUuids: string[];
}

/**
 * 批量操作响应
 */
export type BatchOperationResponse = BatchOperationResponseDTO;

// ============ 任务历史 ============

/**
 * 获取任务模板历史请求
 */
export interface GetTaskTemplateHistoryRequest {
  templateUuid: string;
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

// ============ 导出/导入 ============

/**
 * 导出任务模板请求
 */
export interface ExportTaskTemplatesRequest {
  accountUuid: string;
  templateUuids?: string[];
  format: 'json' | 'csv' | 'markdown';
  includeInstances?: boolean;
  includeHistory?: boolean;
}

/**
 * 导出响应
 */
export interface ExportTaskTemplatesResponse {
  data: string | Uint8Array;
  filename: string;
  mimeType: string;
}

/**
 * 导入任务模板请求
 */
export interface ImportTaskTemplatesRequest {
  accountUuid: string;
  data: string | Uint8Array;
  format: 'json' | 'csv';
  folderUuid?: string;
  overwriteExisting?: boolean;
}

/**
 * 导入响应
 */
export interface ImportTaskTemplatesResponse {
  importedCount: number;
  skippedCount: number;
  errors?: Array<{
    line: number;
    error: string;
  }>;
}

// ============ 任务聚合视图 ============

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
 * 任务实例聚合视图响应
 */
export interface TaskInstanceAggregateViewResponse {
  instance: TaskInstanceServerDTO | TaskInstanceClientDTO;
  template: TaskTemplateServerDTO | TaskTemplateClientDTO;
  dependencies?: (TaskDependencyServerDTO | TaskDependencyClientDTO)[];
}

// ============ 统计相关事件 ============

/**
 * 任务统计更新事件
 * 用于事件驱动的增量统计更新
 */
export interface TaskStatisticsUpdateEvent {
  type:
    | 'template.created'
    | 'template.deleted'
    | 'template.status_changed'
    | 'template.archived'
    | 'instance.created'
    | 'instance.deleted'
    | 'instance.completed'
    | 'instance.started'
    | 'instance.skipped'
    | 'instance.expired'
    | 'dependency.created'
    | 'dependency.deleted';
  accountUuid: string;
  timestamp: number;
  payload: {
    templateUuid?: string;
    instanceUuid?: string;
    previousStatus?: TaskTemplateStatus | TaskInstanceStatus;
    newStatus?: TaskTemplateStatus | TaskInstanceStatus;
    taskType?: TaskType;
    importance?: ImportanceLevel;
    duration?: number;
    rating?: number;
    [key: string]: any;
  };
}

// ============ ONE_TIME Task 请求/响应 ============

/**
 * 创建一次性任务请求
 */
export interface CreateOneTimeTaskRequest {
  accountUuid: string;
  title: string;
  description?: string;
  startDate: number; // Unix timestamp (ms)
  dueDate: number; // Unix timestamp (ms)
  importance?: number; // 0-4
  urgency?: number; // 0-4
  goalUuid?: string;
  keyResultUuid?: string;
  parentTaskUuid?: string;
  tags?: string[];
  color?: string;
  estimatedMinutes?: number;
  note?: string;
}

/**
 * 更新一次性任务请求
 */
export interface UpdateOneTimeTaskRequest {
  title?: string;
  description?: string;
  startDate?: number;
  dueDate?: number;
  importance?: number;
  urgency?: number;
  tags?: string[];
  color?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  note?: string;
}

/**
 * 任务过滤器（用于查询一次性任务）
 */
export interface TaskFiltersRequest {
  accountUuid?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';
  goalUuid?: string;
  keyResultUuid?: string;
  parentTaskUuid?: string;
  tags?: string[];
  startDateFrom?: string; // ISO date string
  startDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  minImportance?: number;
  minUrgency?: number;
  priorityLevels?: ('HIGH' | 'MEDIUM' | 'LOW')[];
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

/**
 * 批量更新优先级请求
 */
export interface BatchUpdatePriorityRequest {
  taskUuids: string[];
  importance?: number;
  urgency?: number;
}

/**
 * 批量取消任务请求
 */
export interface BatchCancelTasksRequest {
  taskUuids: string[];
  reason?: string;
}

/**
 * 关联任务到目标请求
 */
export interface LinkTaskToGoalRequest {
  goalUuid: string;
  keyResultUuid?: string;
}

/**
 * 阻塞/取消任务请求
 */
export interface BlockOrCancelTaskRequest {
  reason?: string;
}
