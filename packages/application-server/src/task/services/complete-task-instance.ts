/**
 * Complete Task Instance Service
 *
 * 完成任务实例
 */

import type {
  ITaskInstanceRepository,
  ITaskTemplateRepository,
} from '@dailyuse/domain-server/task';
import type {
  TaskInstanceClientDTO,
  TaskInstanceCompletedEvent,
  CompleteTaskInstanceRequest,
  TaskInstanceResponse,
} from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';
import { TaskContainer } from '@dailyuse/infrastructure-server';

/**
 * Complete Task Instance Service
 */
export class CompleteTaskInstance {
  private static instance: CompleteTaskInstance;

  private constructor(
    private readonly instanceRepository: ITaskInstanceRepository,
    private readonly templateRepository: ITaskTemplateRepository,
  ) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(
    instanceRepository?: ITaskInstanceRepository,
    templateRepository?: ITaskTemplateRepository,
  ): CompleteTaskInstance {
    const container = TaskContainer.getInstance();
    const instanceRepo = instanceRepository || container.getInstanceRepository();
    const templateRepo = templateRepository || container.getTemplateRepository();
    CompleteTaskInstance.instance = new CompleteTaskInstance(instanceRepo, templateRepo);
    return CompleteTaskInstance.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CompleteTaskInstance {
    if (!CompleteTaskInstance.instance) {
      CompleteTaskInstance.instance = CompleteTaskInstance.createInstance();
    }
    return CompleteTaskInstance.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CompleteTaskInstance.instance = undefined as unknown as CompleteTaskInstance;
  }

  async execute(uuid: string, request?: CompleteTaskInstanceRequest): Promise<TaskInstanceResponse> {
    const instance = await this.instanceRepository.findByUuid(uuid);
    if (!instance) {
      throw new Error(`TaskInstance ${uuid} not found`);
    }

    if (!instance.canComplete()) {
      throw new Error('Cannot complete this task instance');
    }

    // 标记为完成
    instance.complete(request?.duration, request?.note, request?.rating);
    await this.instanceRepository.save(instance);

    // 发布事件
    await this.publishTaskCompletedEvent(instance);

    return {
      instance: instance.toClientDTO(),
    };
  }

  /**
   * 发布任务完成事件
   */
  private async publishTaskCompletedEvent(instance: any): Promise<void> {
    try {
      const template = await this.templateRepository.findByUuid(instance.templateUuid);
      if (!template) {
        console.warn(`[CompleteTaskInstance] Template not found: ${instance.templateUuid}`);
        return;
      }

      const completedAt = instance.completionRecord?.completedAt || Date.now();

      const event: TaskInstanceCompletedEvent = {
        eventType: 'task.instance.completed',
        payload: {
          taskInstanceUuid: instance.uuid,
          taskTemplateUuid: instance.templateUuid,
          title: template.title,
          completedAt,
          accountUuid: instance.accountUuid,
          goalBinding: template.goalBinding
            ? {
                goalUuid: template.goalBinding.goalUuid,
                keyResultUuid: template.goalBinding.keyResultUuid,
                incrementValue: template.goalBinding.incrementValue,
              }
            : undefined,
        },
      };

      await eventBus.publish(event);
    } catch (error) {
      console.error('❌ [CompleteTaskInstance] Failed to publish event', error);
    }
  }
}
