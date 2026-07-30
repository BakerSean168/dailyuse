/**
 * Complete Task Instance Service
 */

import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import type { CompleteTaskInstanceReq, TaskInstanceOperationRes } from '@memoflow/contracts/task';
import { TaskGoalBindingTrigger, TaskInstanceStatus } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type { TaskInstance } from '../../../domain/aggregates/task-instance';
import type { TaskTemplate } from '../../../domain/aggregates/task-template';
import { isFiniteTaskPlan } from '../../../domain/aggregates/task-template-goal.policy';

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
    identityId: string,
    request?: CompleteTaskInstanceReq,
  ): Promise<Result<TaskInstanceOperationRes>> {
    const instance = await this.instanceRepository.findByIdForIdentity(identityId, id);
    if (!instance) {
      return error('NOT_FOUND', `TaskInstance ${id} not found`);
    }

    if (instance.status === TaskInstanceStatus.Completed) {
      return ok({
        instance: instance.toClientDTO(),
      });
    }

    if (!instance.canComplete()) {
      return error('VALIDATION_ERROR', 'Cannot complete this task instance');
    }

    const template = await this.templateRepository.findByIdForIdentity(
      identityId,
      String(instance.templateId),
    );
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

    if (
      !template ||
      !goalBinding ||
      goalBinding.progressTrigger !== TaskGoalBindingTrigger.AllInstancesCompleted
    ) {
      return { taskTitle, goalBinding, allInstancesCompleted: false };
    }

    return {
      taskTitle,
      goalBinding,
      allInstancesCompleted: await this.areAllInstancesCompleted(
        instance,
        template,
        String(instance.identityId),
      ),
    };
  }

  /**
   * 「本实例完成后」模板下所有相关实例（截至本实例日期）是否都已完成。
   * 兄弟实例读自持久化状态；本实例即将被标记完成，故只需其余相关实例均已完成。
   */
  private async areAllInstancesCompleted(
    instance: TaskInstance,
    template: TaskTemplate,
    identityId: string,
  ): Promise<boolean> {
    if (!isFiniteTaskPlan(template.taskType, template.recurrenceRule)) {
      return false;
    }

    const siblings = await this.instanceRepository.findByTemplateId(
      String(instance.templateId),
      identityId,
    );
    const relevant = siblings.filter((sibling) => !sibling.deletedAt);

    if (relevant.length === 0 || !this.isFiniteScopeFullyGenerated(template, relevant.length)) {
      return false;
    }

    return relevant.every(
      (sibling) =>
        String(sibling.id) === String(instance.id) ||
        sibling.status === TaskInstanceStatus.Completed,
    );
  }

  private isFiniteScopeFullyGenerated(template: TaskTemplate, instanceCount: number): boolean {
    if (!template.recurrenceRule) {
      return instanceCount > 0;
    }

    if (template.recurrenceRule.occurrences !== null) {
      return instanceCount >= template.recurrenceRule.occurrences;
    }

    return (
      template.recurrenceRule.endDate !== null &&
      template.lastGeneratedDate !== null &&
      template.lastGeneratedDate >= template.recurrenceRule.endDate
    );
  }
}
