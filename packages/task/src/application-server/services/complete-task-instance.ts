/**
 * Complete Task Instance Service
 *
 * 瀹屾垚浠诲姟瀹炰緥
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
    const instance = await this.instanceRepository.findById(uuid);
    if (!instance) {
      return error('NOT_FOUND', `TaskInstance ${uuid} not found`);
    }

    if (!instance.canComplete()) {
      return error('VALIDATION_ERROR', 'Cannot complete this task instance');
    }

    // 鏍囪涓哄畬锟?
    instance.complete(request?.duration, request?.note, request?.rating);
    await this.instanceRepository.save(instance);

    // 鍙戝竷浜嬩欢
    await this.publishTaskCompletedEvent(instance);

    return ok({
      instance: instance.toClientDTO(),
    });
  }

  /**
   * 鍙戝竷浠诲姟瀹屾垚浜嬩欢
   */
  private async publishTaskCompletedEvent(instance: any): Promise<void> {
    try {
      const template = await this.templateRepository.findById(instance.templateId);
      if (!template) {
        console.warn(`[CompleteTaskInstance] Template not found: ${instance.templateId}`);
        return;
      }

      const completedAt = instance.completionRecord?.completedAt || Date.now();

      const event: TaskInstanceCompletedEvent = {
        eventType: 'task.instance.completed',
        payload: {
          taskInstanceId: instance.id,
          taskTemplateId: instance.templateId,
          title: template.title,
          completedAt,
          identityId: instance.identityId,
          goalBinding: template.goalBinding
            ? {
                goalId: template.goalBinding.goalId,
                keyResultId: template.goalBinding.keyResultId,
                incrementValue: template.goalBinding.incrementValue,
              }
            : undefined,
        },
      };

      await eventBus.publish(event);
    } catch (error) {
      console.error('锟?[CompleteTaskInstance] Failed to publish event', error);
    }
  }
}

