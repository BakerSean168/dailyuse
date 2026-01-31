/**
 * One-Time Task Requests
 * 一次性任务请求类型定义
 */

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
