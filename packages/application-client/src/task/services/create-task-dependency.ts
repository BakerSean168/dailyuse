/**
 * Create Task Dependency
 *
 * 创建任务依赖关系用例
 */

import type { ITaskDependencyApiClient } from '@dailyuse/infrastructure-client';
import type {
  CreateTaskDependencyRequest,
  TaskDependencyClientDTO,
} from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';
import { TaskContainer } from '@dailyuse/infrastructure-client';
import { TaskDependencyEvents } from './task-dependency-events';

/**
 * Create Task Dependency
 */
export class CreateTaskDependency {
  private static instance: CreateTaskDependency;

  private constructor(private readonly apiClient: ITaskDependencyApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskDependencyApiClient): CreateTaskDependency {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getDependencyApiClient();
    CreateTaskDependency.instance = new CreateTaskDependency(client);
    return CreateTaskDependency.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateTaskDependency {
    if (!CreateTaskDependency.instance) {
      CreateTaskDependency.instance = CreateTaskDependency.createInstance();
    }
    return CreateTaskDependency.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateTaskDependency.instance = undefined as unknown as CreateTaskDependency;
  }

  /**
   * 执行用例
   */
  async execute(taskUuid: string, request: CreateTaskDependencyRequest): Promise<TaskDependencyClientDTO> {
    const dependency = await this.apiClient.createDependency(taskUuid, request);

    eventBus.emit(TaskDependencyEvents.DEPENDENCY_CREATED, {
      taskUuid,
      dependencyUuid: dependency.uuid,
      predecessorTaskUuid: request.predecessorTaskUuid,
      reason: TaskDependencyEvents.DEPENDENCY_CREATED,
      timestamp: Date.now(),
    });

    return dependency;
  }
}
