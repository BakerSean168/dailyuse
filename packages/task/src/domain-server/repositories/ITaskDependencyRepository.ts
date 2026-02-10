/**
 * TaskDependency Repository Interface
 * 任务依赖关系仓储接口
 */

import type {
  CircularDependencyValidationResult,
  CreateTaskDependencyRequest,
  TaskDependencyServerDTO,
} from '@dailyuse/contracts/task';

/**
 * TaskDependency 仓储接口
 *
 * DDD 仓储职责：
 * - 依赖关系的持久化
 * - 依赖关系的查询
 * - 依赖图的构建
 */
export interface ITaskDependencyRepository {
  /**
   * 创建依赖关系
   */
  create(data: CreateTaskDependencyRequest): Promise<TaskDependencyServerDTO>;

  /**
   * 根据 UUID 查找依赖关系
   */
  findByUuid(uuid: string): Promise<TaskDependencyServerDTO | null>;

  /**
   * 查找任务的所有前置依赖
   * @param taskUuid 任务 UUID
   * @returns 此任务依赖的所有任务（前置任务列表）
   */
  findBySuccessor(taskUuid: string): Promise<TaskDependencyServerDTO[]>;

  /**
   * 查找任务的所有后续依赖
   * @param taskUuid 任务 UUID
   * @returns 依赖此任务的所有任务（后续任务列表）
   */
  findByPredecessor(taskUuid: string): Promise<TaskDependencyServerDTO[]>;

  /**
   * 查找特定的依赖关系
   */
  findByPredecessorAndSuccessor(
    predecessorUuid: string,
    successorUuid: string,
  ): Promise<TaskDependencyServerDTO | null>;

  /**
   * 获取任务的完整依赖链（递归）
   * @param taskUuid 任务 UUID
   * @returns 所有前置任务（递归）
   */
  findAllPredecessors(taskUuid: string): Promise<string[]>;

  /**
   * 获取任务的完整后续链（递归）
   * @param taskUuid 任务 UUID
   * @returns 所有后续任务（递归）
   */
  findAllSuccessors(taskUuid: string): Promise<string[]>;

  /**
   * 删除依赖关系
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量删除任务的所有依赖关系
   */
  deleteByTask(taskUuid: string): Promise<void>;

  /**
   * 更新依赖关系
   */
  update(
    uuid: string,
    data: { dependencyType?: string; lagDays?: number },
  ): Promise<TaskDependencyServerDTO>;

  /**
   * 获取账户的所有依赖关系
   */
  findAllByAccount(accountUuid: string): Promise<TaskDependencyServerDTO[]>;
}
