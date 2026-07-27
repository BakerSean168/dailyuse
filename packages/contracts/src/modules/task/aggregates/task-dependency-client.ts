/**
 * Task Dependency Client DTOs
 * 任务依赖关系客户端数据传输对象
 *
 * Residual 831: TaskDependencyClientDTO dual retired — sole TaskDependencyResponseSchema + z.infer.
 * DependencyChainClientDTO keeps interface body (extra estimatedCompletionDate vs ResponseSchema).
 */

import type { z } from 'zod';
import type {
  TaskTemplateId,
  Instant,
} from '../../../primitives';
import { TaskDependencyResponseSchema } from '../api/response-schemas';

// Residual 831: TaskDependencyClientDTO dual retired — OpenAPI + transport use TaskDependencyResponseSchema.
export type TaskDependencyClientDTO = z.infer<typeof TaskDependencyResponseSchema>;

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
 * Keep interface dual intentionally — ResponseSchema omits estimatedCompletionDate.
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
  /** ADR-037: Instant epoch ms */
  estimatedCompletionDate?: Instant;
}
