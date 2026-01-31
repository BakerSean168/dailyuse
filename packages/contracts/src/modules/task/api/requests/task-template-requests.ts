/**
 * Task Template Requests
 * 任务模板请求类型定义
 */

import type {
  TaskTimeConfigServerDTO,
  RecurrenceRuleServerDTO,
  TaskReminderConfigServerDTO,
  TaskGoalBindingServerDTO,
} from '../../value-objects';
import type { TaskType } from '../../value-objects/task-type';
import type { TaskTemplateStatus } from '../../value-objects/task-template-status';
import type { ImportanceLevel } from '../../../../shared/index';

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
 * 获取任务模板历史请求
 */
export interface GetTaskTemplateHistoryRequest {
  templateUuid: string;
  page?: number;
  pageSize?: number;
}
