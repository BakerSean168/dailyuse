/**
 * Task Dependency API Client Port
 *
 * 定义任务依赖关系 API 客户端接口。
 * 使用依赖注入模式，适配器在运行时注入。
 */

import type {
  TaskDependencyClientDTO,
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
  ValidateDependencyRequest,
  ValidateDependencyResponse,
  DependencyChainClientDTO,
} from '@dailyuse/contracts/task';

/**
 * ITaskDependencyApiClient
 *
 * 任务依赖关系 API 客户端接口
 */
export interface ITaskDependencyApiClient {
  /**
   * 创建任务依赖关系
   */
  createDependency(
    taskUuid: string,
    request: CreateTaskDependencyRequest,
  ): Promise<TaskDependencyClientDTO>;

  /**
   * 获取任务的所有前置依赖
   */
  getDependencies(taskUuid: string): Promise<TaskDependencyClientDTO[]>;

  /**
   * 获取依赖此任务的所有任务（后续任务）
   */
  getDependents(taskUuid: string): Promise<TaskDependencyClientDTO[]>;

  /**
   * 获取任务的完整依赖链信息
   */
  getDependencyChain(taskUuid: string): Promise<DependencyChainClientDTO>;

  /**
   * 验证依赖关系（不实际创建）
   */
  validateDependency(request: ValidateDependencyRequest): Promise<ValidateDependencyResponse>;

  /**
   * 删除依赖关系
   */
  deleteDependency(uuid: string): Promise<void>;

  /**
   * 更新依赖关系
   */
  updateDependency(
    uuid: string,
    request: UpdateTaskDependencyRequest,
  ): Promise<TaskDependencyClientDTO>;
}
