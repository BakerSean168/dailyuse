/**
 * Task Dependency Client DTOs
 * 任务依赖关系客户端数据传输对象
 */

import type {
  TaskDependencyId,
  TaskTemplateId,
  TransferDate,
  DomainDate,
} from '../../../primitives';
import type { DependencyType } from '../value-objects/dependency-type';
import type { DependencyStatus } from '../value-objects/dependency-status';

/**
 * 任务依赖关系实体（客户端）
 */
export interface TaskDependencyClientDTO {
  id: TaskDependencyId;
  predecessorTaskId: TaskTemplateId;
  successorTaskId: TaskTemplateId;
  dependencyType: DependencyType;
  lagDays?: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  /**
   * 前置任务的标题（用于显示）
   */
  predecessorTaskTitle?: string;

  /**
   * 后续任务的标题（用于显示）
   */
  successorTaskTitle?: string;
}

/**
 * 带依赖信息的任务模板（客户端）
 */
export interface TaskTemplateWithDependenciesClientDTO {
  id: TaskTemplateId;
  title: string;
  // ... 其他 TaskTemplate 字段

  dependencies: TaskDependencyClientDTO[];
  dependents: TaskTemplateId[];
  dependencyStatus: DependencyStatus;
  isBlocked: boolean;
  blockingReason?: string;

  /**
   * 可以开始的最早时间（基于依赖计算）
   */
  earliestStartTime?: DomainDate;

  /**
   * 依赖层级（用于可视化）
   */
  dependencyLevel?: number;
}

/**
 * 将 ServerDTO 转换为 ClientDTO
 * 剥离 identityId，添加 version/deletedAt 传输字段
 */
export function dependencyServerToClientDTO(
  server: import('./task-dependency-server').TaskDependencyServerDTO,
): TaskDependencyClientDTO {
  return {
    id: server.id,
    predecessorTaskId: server.predecessorTaskId,
    successorTaskId: server.successorTaskId,
    dependencyType: server.dependencyType,
    lagDays: server.lagDays,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt,
  };
}

/**
 * 依赖链信息（客户端）
 */
export interface DependencyChainClientDTO {
  taskId: TaskTemplateId;
  allPredecessors: TaskTemplateId[];
  allSuccessors: TaskTemplateId[];
  depth: number;
  isOnCriticalPath: boolean;

  /**
   * 关键路径的预计完成时间
   */
  estimatedCompletionDate?: DomainDate;
}
