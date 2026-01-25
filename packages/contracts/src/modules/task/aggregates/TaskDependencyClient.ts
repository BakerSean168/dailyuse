/**
 * Task Dependency Client DTOs
 * 任务依赖关系客户端数据传输对象
 */

import type { DependencyType, DependencyStatus } from '../enums';

/**
 * 任务依赖关系实体（客户端）
 */
export interface TaskDependencyClientDTO {
  readonly uuid: string;
  readonly predecessorTaskUuid: string;
  readonly successorTaskUuid: string;
  readonly dependencyType: DependencyType;
  readonly lagDays?: number;
  readonly createdAt: number;
  readonly updatedAt: number;

  /**
   * 前置任务的标题（用于显示）
   */
  readonly predecessorTaskTitle?: string;

  /**
   * 后续任务的标题（用于显示）
   */
  readonly successorTaskTitle?: string;
}

/**
 * 带依赖信息的任务模板（客户端）
 */
export interface TaskTemplateWithDependenciesClientDTO {
  readonly uuid: string;
  readonly title: string;
  // ... 其他 TaskTemplate 字段

  readonly dependencies: TaskDependencyClientDTO[];
  readonly dependents: string[];
  readonly dependencyStatus: DependencyStatus;
  readonly isBlocked: boolean;
  readonly blockingReason?: string;

  /**
   * 可以开始的最早时间（基于依赖计算）
   */
  readonly earliestStartTime?: Date;

  /**
   * 依赖层级（用于可视化）
   */
  readonly dependencyLevel?: number;
}

/**
 * 依赖链信息（客户端）
 */
export interface DependencyChainClientDTO {
  readonly taskUuid: string;
  readonly allPredecessors: string[];
  readonly allSuccessors: string[];
  readonly depth: number;
  readonly isOnCriticalPath: boolean;

  /**
   * 关键路径的预计完成时间
   */
  readonly estimatedCompletionDate?: Date;
}

/**
 * 创建依赖请求
 */
export interface CreateTaskDependencyRequest {
  readonly accountUuid: string;
  readonly predecessorTaskUuid: string;
  readonly successorTaskUuid: string;
  readonly dependencyType: DependencyType;
  readonly lagDays?: number;
}

/**
 * 更新依赖请求
 */
export interface UpdateTaskDependencyRequest {
  readonly dependencyType?: DependencyType;
  readonly lagDays?: number;
}

/**
 * 验证依赖请求
 */
export interface ValidateDependencyRequest {
  readonly predecessorTaskUuid: string;
  readonly successorTaskUuid: string;
}

/**
 * 验证依赖响应
 */
export interface ValidateDependencyResponse {
  readonly isValid: boolean;
  readonly errors?: string[];
  readonly wouldCreateCycle?: boolean;
  readonly cyclePath?: string[];
  readonly message?: string;
}

/**
 * 批量创建依赖请求
 */
export interface BatchCreateDependenciesRequest {
  readonly dependencies: CreateTaskDependencyRequest[];
}

/**
 * 批量创建依赖响应
 */
export interface BatchCreateDependenciesResponse {
  readonly created: TaskDependencyClientDTO[];
  readonly failed: {
    readonly request: CreateTaskDependencyRequest;
    readonly error: string;
  }[];
}
