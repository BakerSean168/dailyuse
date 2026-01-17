/**
 * Skip Task Instance Service
 *
 * 跳过任务实例
 */

import type { ITaskInstanceRepository } from '@dailyuse/domain-server/task';
import type {
  TaskInstanceClientDTO,
  SkipTaskInstanceRequest,
  TaskInstanceResponse,
} from '@dailyuse/contracts/task';
import { TaskContainer } from '@dailyuse/infrastructure-server/task';

/**
 * Skip Task Instance Service
 */
export class SkipTaskInstance {
  private static instance: SkipTaskInstance;

  private constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(instanceRepository?: ITaskInstanceRepository): SkipTaskInstance {
    const container = TaskContainer.getInstance();
    const repo = instanceRepository || container.getInstanceRepository();
    SkipTaskInstance.instance = new SkipTaskInstance(repo);
    return SkipTaskInstance.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): SkipTaskInstance {
    if (!SkipTaskInstance.instance) {
      SkipTaskInstance.instance = SkipTaskInstance.createInstance();
    }
    return SkipTaskInstance.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    SkipTaskInstance.instance = undefined as unknown as SkipTaskInstance;
  }

  async execute(uuid: string, request?: SkipTaskInstanceRequest): Promise<TaskInstanceResponse> {
    const instance = await this.instanceRepository.findByUuid(uuid);
    if (!instance) {
      throw new Error(`TaskInstance ${uuid} not found`);
    }

    if (!instance.canSkip()) {
      throw new Error('Cannot skip this task instance');
    }

    instance.skip(request?.reason);
    await this.instanceRepository.save(instance);

    return {
      instance: instance.toClientDTO(),
    };
  }
}

