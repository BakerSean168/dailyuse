/**
 * Complete Task Instance Service
 */

import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import type {
  TaskInstanceCompletedEvent,
  CompleteTaskInstanceReq,
  TaskInstanceOperationRes,
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

  async execute(
    id: string,
    request?: CompleteTaskInstanceReq,
  ): Promise<Result<TaskInstanceOperationRes>> {
    const instance = await this.instanceRepository.findById(id);
    if (!instance) {
      return error('NOT_FOUND', `TaskInstance ${id} not found`);
    }

    if (!instance.canComplete()) {
      return error('VALIDATION_ERROR', 'Cannot complete this task instance');
    }

    // Mark as completed
    instance.complete(request?.duration, request?.note, request?.rating);
    await this.instanceRepository.save(instance);

    // Publish completion event
    await this.publishTaskCompletedEvent(instance);

    return ok({
      instance: instance.toClientDTO(),
    });
  }

  /** Publishes a task completed event. */
  private async publishTaskCompletedEvent(instance: any): Promise<void> {
    try {
      const template = await this.templateRepository.findById(instance.templateId);
      if (!template) {
        console.warn(`[CompleteTaskInstance] Template not found: ${instance.templateId}`);
        return;
      }

      const completedAt = instance.completionRecord?.completedAt || Date.now();

      const event: TaskInstanceCompletedEvent = {
        eventType: 'task:instance:completed',
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
                incrementValue: template.goalBinding.goalRecordValue,
              }
            : undefined,
        },
      };

      eventBus.send('task:instance:completed' as any, event.payload as any);
    } catch (error) {
      console.error('[CompleteTaskInstance] Failed to publish event', error);
    }
  }
}
