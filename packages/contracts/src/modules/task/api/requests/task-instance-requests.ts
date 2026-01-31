/**
 * Task Instance Requests
 * 任务实例请求类型定义
 */

import type { TaskInstanceStatus } from '../../value-objects/task-instance-status';

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
