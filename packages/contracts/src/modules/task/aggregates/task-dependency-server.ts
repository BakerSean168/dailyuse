/**
 * Task Dependency Server DTOs
 * 任务依赖关系服务端数据传输对象
 */

import type {
  TaskDependencyId,
  TaskTemplateId,
  TransferDate,
  DomainDate,
} from '@/primitives';
import type { DependencyType } from '../value-objects/dependency-type';
import type { DependencyStatus } from '../value-objects/dependency-status';

/**
 * 任务依赖关系实体（服务端）
 * 表示两个任务之间的依赖关系
 */
export interface TaskDependencyServerDTO {
  /**
   * 依赖关系唯一标识符
   */
  readonly id: string;

  /**
   * 前置任务 ID（必须先完成的任务）
   */
  readonly predecessorTaskId: string;

  /**
   * 后续任务 ID（依赖于前置任务的任务）
   */
  readonly successorTaskId: string;

  /**
   * 依赖类型
   * @default DependencyType.FinishToStart
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
  readonly createdAt: TransferDate;

  /**
   * 更新时间
   */
  readonly updatedAt: TransferDate;
}

/**
 * 带依赖信息的任务模板（服务端）
 * 扩展 TaskTemplateServerDTO，包含依赖关系信息
 */
export interface TaskTemplateWithDependenciesServerDTO {
  /**
   * 任务的基本信息（从 TaskTemplateServerDTO 继承）
   */
  readonly id: string;
  readonly title: string;
  // ... 其他 TaskTemplate 字段

  /**
   * 此任务依赖的其他任务
   * （前置任务列表）
   */
  readonly dependencies: TaskDependencyServerDTO[];

  /**
   * 依赖此任务的其他任务
   * （后续任务的 ID 列表）
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
   * 包含形成循环的任务 ID 数组
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
   * 任务 ID
   */
  readonly taskId: string;

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
