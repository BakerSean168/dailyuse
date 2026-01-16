/**
 * Task Module Query Types & Enums
 * Story 2.5: 支持排序参数和过滤选项 - 后端扩展
 */

import type { TaskTemplateServerDTO, TaskTemplateClientDTO } from './aggregates';
import type { TaskTemplateStatus } from './enums';
import type { ImportanceLevel } from '../../shared/index';

/**
 * 任务排序字段枚举
 * 
 * 支持的排序选项:
 * - PRIORITY: 按优先级降序（由importance和dueDate自动计算）
 * - DUE_DATE: 按截止日期升序；无期限任务排在最后
 * - CREATED_AT: 按创建时间降序（最新创建的在前）
 * - IMPORTANCE: 按重要性值降序（Vital > Important > Moderate > Minor > Trivial）
 */
export enum TaskSortBy {
  PRIORITY = 'priority',
  DUE_DATE = 'dueDate',
  CREATED_AT = 'createdAt',
  IMPORTANCE = 'importance',
}

/**
 * 任务过滤条件枚举
 * 
 * 格式: 'field:value'
 * 多个过滤条件之间使用 AND 关系
 * 
 * 示例: filterBy=['importance:vital', 'status:active']
 *       返回: 重要性为 Vital 且状态为 Active 的任务
 */
export enum TaskFilterBy {
  // ===== Importance-based filters =====
  /** 仅返回 importance >= Vital 的任务 */
  IMPORTANCE_VITAL = 'importance:vital',
  
  /** 仅返回 importance >= Important 的任务 */
  IMPORTANCE_IMPORTANT = 'importance:important',
  
  /** 仅返回 importance >= Moderate 的任务 */
  IMPORTANCE_MODERATE = 'importance:moderate',
  
  /** 仅返回 importance >= Minor 的任务 */
  IMPORTANCE_MINOR = 'importance:minor',
  
  /** 返回所有任务（importance >= Trivial） */
  IMPORTANCE_TRIVIAL = 'importance:trivial',

  // ===== Status-based filters =====
  /** 仅返回活跃任务（status = ACTIVE） */
  STATUS_ACTIVE = 'status:active',
  
  /** 仅返回已完成任务（status = COMPLETED） */
  STATUS_COMPLETED = 'status:completed',
  
  /** 仅返回被阻塞的任务（status = BLOCKED） */
  STATUS_BLOCKED = 'status:blocked',
  
  /** 仅返回已取消的任务（status = CANCELLED） */
  STATUS_CANCELLED = 'status:cancelled',

  // ===== Time-based filters =====
  /** 仅返回已逾期的任务 */
  DUE_DATE_OVERDUE = 'dueDate:overdue',
  
  /** 仅返回今天到期的任务 */
  DUE_DATE_TODAY = 'dueDate:today',
  
  /** 仅返回未来7天内到期的任务 */
  DUE_DATE_UPCOMING = 'dueDate:upcoming',
  
  /** 仅返回无截止期限的任务 */
  DUE_DATE_NO_DUE_DATE = 'dueDate:noDueDate',
}

/**
 * 查询任务列表的请求参数
 * 
 * 支持灵活的排序和过滤：
 * - sortBy: 指定排序字段（默认: priority）
 * - filterBy: 过滤条件数组（AND 关系）
 */
export interface QueryTasksRequest {
  accountUuid: string;
  
  /**
   * 排序字段
   * 
   * 默认: TaskSortBy.PRIORITY
   * 允许: priority | dueDate | createdAt | importance
   */
  sortBy?: TaskSortBy | string;
  
  /**
   * 过滤条件数组
   * 
   * 多个条件之间使用 AND 关系
   * 
   * 示例:
   * - ['importance:vital'] 返回 importance >= Vital 的任务
   * - ['importance:important', 'status:active'] 返回重要且激活的任务
   * - ['dueDate:overdue'] 返回已逾期的任务
   */
  filterBy?: (TaskFilterBy | string)[];
  
  /** 分页: 页码（从1开始） */
  page?: number;
  
  /** 分页: 每页数量 */
  limit?: number;
}

/**
 * 任务列表查询响应
 * 
 * 返回排序和过滤后的任务列表，以及元数据
 */
export interface TasksListResponse {
  /** 操作是否成功 */
  ok: boolean;
  
  /** 任务列表（包含计算得的 priority 字段） */
  data?: Array<(TaskTemplateServerDTO | TaskTemplateClientDTO) & { priority: number }>;
  
  /** 错误消息（ok=false 时存在） */
  error?: string;
  
  /** 响应元数据 */
  meta?: {
    /** 返回的任务总数 */
    count: number;
    
    /** 实际应用的排序字段 */
    sortedBy: string;
    
    /** 实际应用的过滤条件数组 */
    filteredBy: string[];
  };
}

/**
 * 获取任务（带优先级计算）的请求
 * 
 * 返回值包含自动计算的 priority 字段
 */
export interface GetTasksWithPriorityRequest {
  accountUuid: string;
  
  /** 当前时间（用于优先级计算和相对日期过滤），默认: new Date() */
  currentTime?: Date;
}

/**
 * 获取任务（带优先级和排序/过滤）的请求
 * 
 * Story 2.5 完整实现：支持排序、过滤和优先级计算
 */
export interface GetTasksWithSortingAndFilteringRequest extends GetTasksWithPriorityRequest {
  /** 排序字段，默认: TaskSortBy.PRIORITY */
  sortBy?: TaskSortBy | string;
  
  /** 过滤条件，默认: [] */
  filterBy?: (TaskFilterBy | string)[];
}
