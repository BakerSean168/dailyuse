/**
 * Complete Task Instance Service
 */

import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import type { CompleteTaskInstanceReq, TaskInstanceOperationRes } from '@memoflow/contracts/task';
import { TaskInstanceStatus } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok, error, fail } from '@memoflow/contracts/result';
import { createLogger } from '@memoflow/utils/logger';
import {
  mapTaskWriteErrorToResultError,
  type TaskWriteRepositories,
  type TaskWriteTransactionRunner,
} from './task-write-support';
import { reevaluateTaskPlanOutcome } from './task-plan-outcome-reevaluation';

/**
 * Complete Task Instance Service
 *
 * 完成任务实例，并在发布 `task:instance-completed` 前把跨模块订阅方（Goal）
 * 所需的判定信息填齐（ADR-033 范式 A：payload 自包含）。判定逻辑本属 Task，
 * 因此从旧的 desktop handler 迁到这里，事件发布前算好。
 */
export class CompleteTaskInstanceUseCase {
  private readonly logger = createLogger('CompleteTaskInstanceUseCase');
  private readonly transactionRunner: TaskWriteTransactionRunner;

  constructor(
    private readonly instanceRepository: ITaskInstanceRepository,
    private readonly templateRepository: ITaskTemplateRepository,
    transactionRunner: TaskWriteTransactionRunner,
  ) {
    if (!transactionRunner) {
      throw new Error('TaskWriteTransactionRunner must be explicitly provided to CompleteTaskInstanceUseCase');
    }
    this.transactionRunner = transactionRunner;
  }

  async execute(
    id: string,
    identityId: string,
    request?: CompleteTaskInstanceReq,
  ): Promise<Result<TaskInstanceOperationRes>> {
    try {
      return await this.transactionRunner.run((repositories) =>
        this.executeInTransaction(repositories, id, identityId, request),
      );
    } catch (caughtError) {
      this.logger.error('Failed to complete task instance', { error: caughtError });
      return fail(
        mapTaskWriteErrorToResultError(caughtError, 'Failed to complete task instance'),
      );
    }
  }

  private async executeInTransaction(
    repositories: TaskWriteRepositories,
    id: string,
    identityId: string,
    request?: CompleteTaskInstanceReq,
  ): Promise<Result<TaskInstanceOperationRes>> {
    const instance = await repositories.instanceRepository.findByIdForIdentity(identityId, id);
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

    const template = await repositories.templateRepository!.findByIdForIdentity(
      identityId,
      String(instance.templateId),
    );
    const goalContext = {
      taskTitle: template?.title ?? '',
      goalBinding: template?.goalBinding?.toDTO() ?? null,
    };

    // Mark as completed（goalContext 会被嵌入领域事件的 payload）
    instance.complete(request?.duration, request?.note, request?.rating, goalContext);
    await repositories.instanceRepository.save(instance);
    await reevaluateTaskPlanOutcome(repositories, identityId, String(instance.templateId), instance.id);

    return ok({
      instance: instance.toClientDTO(),
    });
  }


}
