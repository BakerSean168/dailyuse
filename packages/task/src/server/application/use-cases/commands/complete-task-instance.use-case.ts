/**
 * Complete Task Instance Service
 */

import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import type { CompleteTaskInstanceReq, TaskInstanceOperationRes } from '@dailyuse/contracts/task';
import { TaskGoalBindingTrigger, TaskInstanceStatus } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { TaskInstance } from '../../../domain/aggregates/task-instance';
import type { TaskTemplate } from '../../../domain/aggregates/task-template';

/**
 * Complete Task Instance Service
 *
 * 完成任务实例，并在发布 `task:instance-completed` 前把跨模块订阅方（Goal）
 * 所需的判定信息填齐（ADR-033 范式 A：payload 自包含）。判定逻辑本属 Task，
 * 因此从旧的 desktop handler 迁到这里，事件发布前算好。
 */
export class CompleteTaskInstanceUseCase {
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

    const template = await this.templateRepository.findById(String(instance.templateId));
    const goalContext = await this.buildGoalContext(instance, template);

    // Mark as completed（goalContext 会被嵌入领域事件的 payload）
    instance.complete(request?.duration, request?.note, request?.rating, goalContext);
    await this.instanceRepository.save(instance);

    return ok({
      instance: instance.toClientDTO(),
    });
  }

  /**
   * 组装事件所需的目标绑定上下文。
   * 未绑定目标时 goalBinding = null，订阅方据此忽略。
   * AllInstancesCompleted 触发条件下，把「本实例完成后是否全部相关实例完成」算好。
   */
  private async buildGoalContext(
    instance: TaskInstance,
    template: TaskTemplate | null,
  ): Promise<{
    taskTitle: string;
    goalBinding: ReturnType<TaskTemplate['toServerDTO']>['goalBinding'];
    allInstancesCompleted: boolean;
  }> {
    const goalBinding = template?.goalBinding?.toDTO() ?? null;
    const taskTitle = template?.title ?? '';

    if (!goalBinding || goalBinding.progressTrigger !== TaskGoalBindingTrigger.AllInstancesCompleted) {
      return { taskTitle, goalBinding, allInstancesCompleted: false };
    }

    return {
      taskTitle,
      goalBinding,
      allInstancesCompleted: await this.areAllInstancesCompleted(instance),
    };
  }

  /**
   * 「本实例完成后」模板下所有相关实例（截至本实例日期）是否都已完成。
   * 兄弟实例读自持久化状态；本实例即将被标记完成，故只需其余相关实例均已完成。
   */
  private async areAllInstancesCompleted(instance: TaskInstance): Promise<boolean> {
    const siblings = await this.instanceRepository.findByTemplateId(String(instance.templateId));
    const relevant = siblings.filter((sibling) => sibling.instanceDate <= instance.instanceDate);

    if (relevant.length === 0) {
      return false;
    }

    return relevant.every(
      (sibling) =>
        String(sibling.id) === String(instance.id) ||
        sibling.status === TaskInstanceStatus.Completed,
    );
  }
}
