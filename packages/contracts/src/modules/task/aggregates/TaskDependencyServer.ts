/**
 * Task Dependency Server DTOs
 * 任务依赖关系服务端数据传输对象
 */

import type { DependencyType, DependencyStatus } from '../enums';

/**
 * 任务依赖关系实体（服务端）
 * 表示两个任务之间的依赖关系
 */
export interface TaskDependencyServerDTO {
  /**
   * 依赖关系唯一标识符
   */
  readonly uuid: string;

  /**
   * 前置任务 UUID（必须先完成的任务）
   */
  readonly predecessorTaskUuid: string;

  /**
   * 后续任务 UUID（依赖于前置任务的任务）
   */
  readonly successorTaskUuid: string;

  /**
   * 依赖类型
   * @default DependencyType.FINISH_TO_START
   */
  readonly dependencyType: DependencyType;

  /**
   * 延迟天数（可选）
   * 前置任务完成后，需要等待的天数
   * @example lagDays = 2 表示前置任务完成后，等待2天后续任务才能开始
   */
  readonly lagDays?: number;

  /**
   * 创建时间
   */
  readonly createdAt: number;

  /**
   * 更新时间
   */
  readonly updatedAt: number;
}

/**
 * 带依赖信息的任务模板（服务端）
 * 扩展 TaskTemplateServerDTO，包含依赖关系信息
 */
export interface TaskTemplateWithDependenciesServerDTO {
  /**
   * 任务的基本信息（从 TaskTemplateServerDTO 继承）
   */
  readonly uuid: string;
  readonly title: string;
  // ... 其他 TaskTemplate 字段

  /**
   * 此任务依赖的其他任务
   * （前置任务列表）
   */
  readonly dependencies: TaskDependencyServerDTO[];

  /**
   * 依赖此任务的其他任务
   * （后续任务的 UUID 列表）
   */
  readonly dependents: string[];

  /**
   * 当前依赖状态
   */
  readonly dependencyStatus: DependencyStatus;

  /**
   * 是否被阻塞
   * 当 dependencyStatus 为 WAITING 或 BLOCKED 时为 true
   */
  readonly isBlocked: boolean;

  /**
   * 阻塞原因（如果被阻塞）
   */
  readonly blockingReason?: string;
}

/**
 * 循环依赖验证结果
 * 用于检测依赖关系是否会形成循环
 */
export interface CircularDependencyValidationResult {
  /**
   * 是否有效（无循环依赖）
   */
  readonly isValid: boolean;

  /**
   * 循环路径（如果存在循环）
   * 包含形成循环的任务 UUID 数组
   * @example ['task-a', 'task-b', 'task-c', 'task-a']
   */
  readonly cycle?: string[];

  /**
   * 验证消息
   */
  readonly message?: string;
}

/**
 * 依赖链信息
 * 表示任务的完整依赖链
 */
export interface DependencyChainServerDTO {
  /**
   * 任务 UUID
   */
  readonly taskUuid: string;

  /**
   * 所有前置任务（递归）
   * 按依赖层级排序
   */
  readonly allPredecessors: string[];

  /**
   * 所有后续任务（递归）
   * 按依赖层级排序
   */
  readonly allSuccessors: string[];

  /**
   * 依赖深度
   * 从根任务（无前置依赖）到此任务的最长路径
   */
  readonly depth: number;

  /**
   * 是否在关键路径上
   */
  readonly isOnCriticalPath: boolean;
}
