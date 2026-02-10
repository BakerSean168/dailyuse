/**
 * Task Instance API Client Port
 *
 * 定义任务实例 API 客户端接口。
 * 使用依赖注入模式，适配器在运行时注入。
 */

import type {
  TaskInstanceClientDTO,
  CompleteTaskInstanceRequest,
  SkipTaskInstanceRequest,
} from '@dailyuse/contracts/task';

/**
 * ITaskInstanceApiClient
 *
 * 任务实例 API 客户端接口
 */
export interface ITaskInstanceApiClient {
  // ===== Task Instance CRUD =====

  /**
   * 获取任务实例列表
   */
  getTaskInstances(params?: {
    page?: number;
    limit?: number;
    templateUuid?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<TaskInstanceClientDTO[]>;

  /**
   * 获取任务实例详情
   */
  getTaskInstanceById(uuid: string): Promise<TaskInstanceClientDTO>;

  /**
   * 删除任务实例
   */
  deleteTaskInstance(uuid: string): Promise<void>;

  // ===== Task Instance 状态管理 =====

  /**
   * 开始任务实例
   */
  startTaskInstance(uuid: string): Promise<TaskInstanceClientDTO>;

  /**
   * 完成任务实例
   */
  completeTaskInstance(
    uuid: string,
    request?: CompleteTaskInstanceRequest,
  ): Promise<TaskInstanceClientDTO>;

  /**
   * 跳过任务实例
   */
  skipTaskInstance(
    uuid: string,
    request?: SkipTaskInstanceRequest,
  ): Promise<TaskInstanceClientDTO>;

  // ===== 批量操作 =====

  /**
   * 检查并标记过期的任务实例
   */
  checkExpiredInstances(): Promise<{
    count: number;
    instances: TaskInstanceClientDTO[];
  }>;
}
