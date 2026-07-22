/**
 * TaskDependency 仓储接口
 * 任务依赖关系仓储
 *
 * DDD 仓储职责：
 * - 依赖关系的持久化
 * - 依赖关系的查询
 * - 依赖图的构建
 */

import type { TaskDependencyServerDTO } from '@dailyuse/contracts/task';
import type { DependencyType } from '@dailyuse/contracts/task';
import type { TaskDependency } from '../aggregates/task-dependency';

/**
 * TaskDependency 仓储接口
 */
export interface ITaskDependencyRepository {
  /**
   * 创建依赖关系
   */
  create(data: {
    predecessorTaskId: string;
    successorTaskId: string;
    dependencyType?: DependencyType;
    lagDays?: number;
    identityId: string;
  }): Promise<TaskDependencyServerDTO>;

  /**
   * 根据 ID 查找依赖关系
   */
  findById(id: string): Promise<TaskDependencyServerDTO | null>;

  /**
   * 根据 ID + identity 查找依赖关系
   */
  findByIdForIdentity(identityId: string, id: string): Promise<TaskDependencyServerDTO | null>;

  /**
   * 查找任务的所有前置依赖
   * @param taskId 后续任务 ID
   * @returns 此任务依赖的所有任务（前置任务列表）
   */
  findBySuccessorId(taskId: string, identityId: string): Promise<TaskDependencyServerDTO[]>;

  /**
   * 查找任务的所有后续依赖
   * @param taskId 前置任务 ID
   * @returns 依赖此任务的所有任务（后续任务列表）
   */
  findByPredecessorId(taskId: string, identityId: string): Promise<TaskDependencyServerDTO[]>;

  /**
   * 查找特定的依赖关系
   */
  findByPredecessorAndSuccessorId(
    predecessorId: string,
    successorId: string,
    identityId: string,
  ): Promise<TaskDependencyServerDTO | null>;

  /**
   * 获取任务的完整依赖链（递归所有前置任务）
   * @param taskId 任务 ID
   * @returns 所有前置任务 ID
   */
  findAllPredecessorIds(taskId: string, identityId: string): Promise<string[]>;

  /**
   * 获取任务的完整后续链（递归所有后续任务）
   * @param taskId 任务 ID
   * @returns 所有后续任务 ID
   */
  findAllSuccessorIds(taskId: string, identityId: string): Promise<string[]>;

  /**
   * 删除依赖关系（identity-scoped）
   */
  delete(identityId: string, id: string): Promise<void>;

  /**
   * Domain-command delete — deletes persistently then publishes aggregate domain events.
   */
  deleteAggregate(dependency: TaskDependency): Promise<void>;

  /**
   * 查找依赖关系聚合（identity-scoped；命令侧删除路径使用）
   */
  findAggregateById(identityId: string, id: string): Promise<TaskDependency | null>;

  /**
   * 批量删除任务的所有依赖关系
   */
  deleteByTaskId(identityId: string, taskId: string): Promise<void>;

  /**
   * 更新依赖关系（identity-scoped）
   */
  update(
    identityId: string,
    id: string,
    data: { dependencyType?: DependencyType; lagDays?: number },
  ): Promise<TaskDependencyServerDTO>;

  /**
   * 获取用户的所有依赖关系
   */
  findAllByIdentityId(identityId: string): Promise<TaskDependencyServerDTO[]>;
}
