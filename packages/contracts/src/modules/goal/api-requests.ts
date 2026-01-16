/**
 * Goal Module API Requests
 * 目标模块 API 请求/响应类型定义
 */

import type {
  GoalServerDTO,
  GoalClientDTO,
  GoalFolderServerDTO,
  GoalFolderClientDTO,
  GoalStatisticsServerDTO,
  GoalStatisticsClientDTO,
} from './aggregates';
import type {
  KeyResultServerDTO,
  KeyResultClientDTO,
  GoalReviewServerDTO,
  GoalReviewClientDTO,
  GoalRecordServerDTO,
  GoalRecordClientDTO,
} from './entities';
import type { GoalStatus, FolderType, KeyResultValueType, AggregationMethod } from './enums';
import type { ImportanceLevel } from '../../shared/index';
import type { BatchOperationResponseDTO } from '../../shared/dtos';

// ============ Goal 请求/响应 ============

/**
 * 创建目标请求
 */
export interface CreateGoalRequest {
  // accountUuid 从认证 token 中自动获取，不需要前端传递
  title: string;
  description?: string;
  color?: string; // 主题色（hex 格式，如 #FF5733）
  feasibilityAnalysis?: string; // 可行性分析
  motivation?: string; // 实现动机
  importance: ImportanceLevel;
  // urgency: UrgencyLevel; // REMOVED - priority 现在是计算属性
  category?: string;
  tags?: string[];
  startDate?: number;
  targetDate?: number;
  folderUuid?: string;
  parentGoalUuid?: string;
  // keyResults 已移除 - 现在通过独立的 API 端点创建 KeyResult
  // 使用 POST /api/goals/{goalUuid}/key-results 来添加 KeyResult
}

/**
 * 更新目标请求
 */
export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  color?: string; // 主题色
  feasibilityAnalysis?: string; // 可行性分析
  motivation?: string; // 实现动机
  importance?: ImportanceLevel;
  // urgency?: UrgencyLevel; // REMOVED
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
  // urgency?: UrgencyLevel[]; // REMOVED
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
 * 目标响应
 * 注意：API 返回的是 GoalClientDTO，包含计算属性
 */
export interface GoalResponse {
  goal: GoalClientDTO;
}

/**
 * 目标列表响应
 * 注意：API 返回的是 GoalClientDTO，包含计算属性
 */
export interface GoalsResponse {
  goals: GoalClientDTO[];
  total: number;
  page: number;
  pageSize: number;
}

// ============ KeyResult 请求/响应 ============

/**
 * 添加关键结果请求
 */
export interface AddKeyResultRequest {
  goalUuid: string;
  title: string;
  description?: string;
  valueType: KeyResultValueType;
  aggregationMethod: AggregationMethod;
  targetValue: number;
  currentValue?: number;
  unit?: string;
  weight: number;
}

/**
 * 更新关键结果请求
 */
export interface UpdateKeyResultRequest {
  title?: string;
  description?: string;
  startValue?: number;
  targetValue?: number;
  unit?: string;
  weight?: number;
}

/**
 * 更新关键结果进度请求
 */
export interface UpdateKeyResultProgressRequest {
  keyResultUuid: string;
  newValue: number;
  note?: string;
}

/**
 * 关键结果响应
 */
export interface KeyResultResponse {
  keyResult: KeyResultServerDTO;
}

/**
 * 关键结果列表响应
 */
export interface KeyResultsResponse {
  keyResults: KeyResultServerDTO[];
  total: number;
}

// ============ GoalRecord 请求/响应 ============

/**
 * 创建目标记录请求
 * 注意：只需要提供新值 (value)，后端会自动计算 previousValue 和 changeAmount
 */
export interface CreateGoalRecordRequest {
  value: number;        // 新的进度值
  note?: string;        // 备注说明
  recordedAt?: number;  // 记录时间戳（可选，默认当前时间）
}

/**
 * 目标记录响应
 */
export interface GoalRecordResponse {
  record: GoalRecordClientDTO;
}

/**
 * 目标记录列表响应
 */
export interface GoalRecordsResponse {
  records: GoalRecordClientDTO[];
  total: number;
}

// ============ GoalReview 请求/响应 ============

/**
 * 创建复盘请求
 */
export interface CreateGoalReviewRequest {
  goalUuid: string;
  title: string;
  content: string;
  reviewType: string;
  rating?: number;
  achievements?: string;
  challenges?: string;
  nextActions?: string;
  reviewedAt?: number;
}

/**
 * 更新复盘请求
 */
export interface UpdateGoalReviewRequest {
  title?: string;
  content?: string;
  rating?: number;
  achievements?: string;
  challenges?: string;
  nextActions?: string;
}

/**
 * 复盘响应
 */
export interface GoalReviewResponse {
  review: GoalReviewServerDTO;
}

/**
 * 复盘列表响应
 */
export interface GoalReviewsResponse {
  reviews: GoalReviewServerDTO[];
  total: number;
}

/**
 * 目标聚合视图响应
 * 包含目标及其所有关联实体的完整视图
 */
export interface GoalAggregateViewResponse {
  goal: GoalClientDTO;
  keyResults?: KeyResultClientDTO[];
  records?: GoalRecordClientDTO[];
  reviews?: GoalReviewClientDTO[];
  statistics?: {
    totalKeyResults: number;
    completedKeyResults: number;
    totalRecords: number;
    totalReviews: number;
    overallProgress: number;
  };
}

// ============ GoalFolder 请求/响应 ============

/**
 * 创建文件夹请求
 */
export interface CreateGoalFolderRequest {
  // accountUuid 从认证 token 中自动获取，不需要前端传递
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentFolderUuid?: string;
}

/**
 * 更新文件夹请求
 */
export interface UpdateGoalFolderRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  parentFolderUuid?: string;
}

/**
 * 查询文件夹请求
 */
export interface QueryGoalFoldersRequest {
  accountUuid: string;
  parentFolderUuid?: string;
  includeSystemFolders?: boolean;
  sortBy?: 'name' | 'createdAt' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 文件夹响应
 */
export interface GoalFolderResponse {
  folder: GoalFolderClientDTO;
}

/**
 * 文件夹列表响应
 */
export interface GoalFoldersResponse {
  folders: GoalFolderClientDTO[];
  total: number;
}

// ============ 类型别名（兼容性） ============
// 为了与 Web 项目的历史命名保持兼容，提供响应别名
export type GoalFolderListResponse = GoalFoldersResponse;

// ============ GoalStatistics 请求/响应 ============

/**
 * 获取统计请求
 */
export interface GetGoalStatisticsRequest {
  accountUuid: string;
  forceRecalculate?: boolean;
}

/**
 * 统计响应
 */
export interface GoalStatisticsResponse {
  statistics: GoalStatisticsClientDTO;
}

// ============ 批量操作 ============

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

/**
 * 批量操作响应
 */
export type BatchOperationResponse = BatchOperationResponseDTO;

// ============ 导出/导入 ============

/**
 * 导出目标请求
 */
export interface ExportGoalsRequest {
  accountUuid: string;
  goalUuids?: string[];
  format: 'json' | 'csv' | 'markdown';
  includeKeyResults?: boolean;
  includeReviews?: boolean;
}

/**
 * 导出响应
 */
export interface ExportGoalsResponse {
  data: string | Uint8Array;
  filename: string;
  mimeType: string;
}

/**
 * 导入目标请求
 */
export interface ImportGoalsRequest {
  accountUuid: string;
  data: string | Uint8Array;
  format: 'json' | 'csv';
  folderUuid?: string;
  overwriteExisting?: boolean;
}

/**
 * 导入响应
 */
export interface ImportGoalsResponse {
  importedCount: number;
  skippedCount: number;
  errors?: Array<{
    line: number;
    error: string;
  }>;
}

// ============ 统计相关 ============

/**
 * 统计更新事件
 *
 * 用于事件驱动的增量统计更新
 */
export interface GoalStatisticsUpdateEvent {
  type:
    | 'goal.created'
    | 'goal.deleted'
    | 'goal.status_changed'
    | 'goal.completed'
    | 'goal.archived'
    | 'goal.activated'
    | 'key_result.created'
    | 'key_result.deleted'
    | 'key_result.completed'
    | 'review.created'
    | 'review.deleted'
    | 'focus_session.completed';
  accountUuid: string;
  timestamp: number;
  payload: {
    previousStatus?: GoalStatus;
    newStatus?: GoalStatus;
    importance?: ImportanceLevel;
    // urgency?: UrgencyLevel; // REMOVED
    category?: string;
    keyResultCount?: number;
    rating?: number;
    focusMinutes?: number;
    [key: string]: any;
  };
}

/**
 * 重新计算统计请求
 */
export interface RecalculateGoalStatisticsRequest {
  accountUuid: string;
  force?: boolean; // 是否强制重算（即使已存在）
}

/**
 * 重新计算统计响应
 */
export interface RecalculateGoalStatisticsResponse {
  ok: boolean;
  message: string;
  statistics: GoalStatisticsServerDTO;
}

/**
 * 初始化统计请求
 */
export interface InitializeGoalStatisticsRequest {
  accountUuid: string;
}

/**
 * 初始化统计响应
 */
export interface InitializeGoalStatisticsResponse {
  ok: boolean;
  message: string;
  statistics: GoalStatisticsServerDTO;
}
