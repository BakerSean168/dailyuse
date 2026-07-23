/**
 * Task Dependency Server DTOs
 * 任务依赖关系服务端数据传输对象
 *
 * Residual 649: with-dependencies / dependency-chain server duals retired
 * (Client chain + dependency entity only).
 */

import type {
  TaskDependencyId,
  TaskTemplateId,
  IdentityId,
  TransferDate,
} from '../../../primitives';
import type { DependencyType } from '../value-objects/dependency-type';

/**
 * 任务依赖关系实体（服务端）
 * 表示两个任务之间的依赖关系
 */
export interface TaskDependencyServerDTO {
  /**
   * 依赖关系唯一标识符
   */
  id: TaskDependencyId;

  /**
   * 身份 ID
   */
  identityId: IdentityId;

  /**
   * 前置任务 ID（必须先完成的任务）
   */
  predecessorTaskId: TaskTemplateId;

  /**
   * 后续任务 ID（依赖于前置任务的任务）
   */
  successorTaskId: TaskTemplateId;

  /**
   * 依赖类型
   * @default DependencyType.FinishToStart
   */
  dependencyType: DependencyType;

  /**
   * 延迟天数（可选）
   * 前置任务完成后，需要等待的天数
   * @example lagDays = 2 表示前置任务完成后，等待2天后续任务才能开始
   */
  lagDays?: number;

  /**
   * 创建时间
   */
  createdAt: TransferDate;

  /**
   * 更新时间
   */
  updatedAt: TransferDate;
}

/**
 * 循环依赖验证结果
 * 用于检测依赖关系是否会形成循环
 */
export interface CircularDependencyValidationResult {
  /**
   * 是否有效（无循环依赖）
   */
  isValid: boolean;

  /**
   * 循环路径（如果存在循环）
   * 包含形成循环的任务 ID 数组
   * @example ['task-a', 'task-b', 'task-c', 'task-a']
   */
  cycle?: TaskTemplateId[];

  /**
   * 验证消息
   */
  message?: string;
}
