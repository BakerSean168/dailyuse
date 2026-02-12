/**
 * Complete Task Instance Service
 *
 * 完成任务实例
 */

import type { ITaskInstanceRepository } from '../../domain-server/repositories/ITaskInstanceRepository';
import type { ITaskTemplateRepository } from '../../domain-server/repositories/ITaskTemplateRepository';
import type {
  TaskInstanceClientDTO,
  TaskInstanceCompletedEvent,
  CompleteTaskInstanceRequest,
  TaskInstanceResponse,
} from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Complete Task Instance Service
 */
export class CompleteTaskInstance {
  constructor(
    private readonly instanceRepository: ITaskInstanceRepository,
    private readonly templateRepository: ITaskTemplateRepository,
  ) {}

  async execute(uuid: string, request?: CompleteTaskInstanceRequest): Promise<Result<TaskInstanceResponse>> {
    const instance = await this.instanceRepository.findByUuid(uuid);
    if (!instance) {
      return error('NOT_FOUND', `TaskInstance ${uuid} not found`);
    }

    if (!instance.canComplete()) {
      return error('VALIDATION_ERROR', 'Cannot complete this task instance');
    }

    // 标记为完�?
    instance.complete(request?.duration, request?.note, request?.rating);
    await this.instanceRepository.save(instance);

    // 发布事件
    await this.publishTaskCompletedEvent(instance);

    return ok({
      instance: instance.toClientDTO(),
    });
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
      console.error('�?[CompleteTaskInstance] Failed to publish event', error);
    }
  }
}

