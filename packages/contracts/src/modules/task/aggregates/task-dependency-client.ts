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

// Residual 649: task-template-with-dependencies client dual retired.

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
