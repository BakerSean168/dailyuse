/**
 * Goal Requests
 */

import type { ImportanceLevel } from '../../../../shared/index';
import type { GoalStatus } from '../../value-objects/goal-status';

/**
 * 创建目标请求
 */
export interface CreateGoalRequest {
  title: string;
  description?: string;
  color?: string; // hex
  feasibilityAnalysis?: string;
  motivation?: string;
  importance: ImportanceLevel;
  category?: string;
  tags?: string[];
  startDate?: number;
  targetDate?: number;
  folderUuid?: string;
  parentGoalUuid?: string;
}

/**
 * 更新目标请求
 */
export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  color?: string;
  feasibilityAnalysis?: string;
  motivation?: string;
  importance?: ImportanceLevel;
  category?: string;
  tags?: string[];
  startDate?: number;
  targetDate?: number;
  folderUuid?: string;
  parentGoalUuid?: string;
}

/**
 * 查询目标请求
 */
export interface QueryGoalsRequest {
  accountUuid: string;
  status?: GoalStatus[];
  importance?: ImportanceLevel[];
  category?: string;
  tags?: string[];
  folderUuid?: string;
  keyword?: string;
  startDate?: number;
  endDate?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'targetDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  includeKeyResults?: boolean;
  includeReviews?: boolean;
}

/**
 * 批量更新目标状态请求
 */
export interface BatchUpdateGoalStatusRequest {
  goalUuids: string[];
  status: GoalStatus;
}

/**
 * 批量移动目标请求
 */
export interface BatchMoveGoalsRequest {
  goalUuids: string[];
  targetFolderUuid: string;
}

/**
 * 批量删除目标请求
 */
export interface BatchDeleteGoalsRequest {
  goalUuids: string[];
  hardDelete?: boolean;
}
