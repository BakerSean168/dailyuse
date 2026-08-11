/**
 * Create Task Template Service
 *
 * Creates a task template (recurring task) and automatically
 * generates initial instances upon creation.
 */

import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import { TaskTemplate } from '../../../domain/aggregates/task-template';
import { TaskTimeConfig, RecurrenceRule, TaskReminderConfig } from '../../../domain/value-objects';
import { TaskTemplateId } from '../../../domain/value-objects/task-template-id';
import { TaskInstanceGenerationService } from '../../../domain/services/index';
import type { CreateTaskTemplateInput, CreateTaskTemplateRes } from '@memoflow/contracts/task';
import { TaskTemplateStatus } from '@memoflow/contracts/task';
import { createLogger } from '@memoflow/utils/logger';
import type { Result } from '@memoflow/contracts/result';
import { error, fail, ok } from '@memoflow/contracts/result';
import {
  mapTaskWriteErrorToResultError,
  type TaskWriteTransactionRunner,
} from './task-write-support';
import { isFiniteTaskPlan } from '../../../domain/aggregates/task-template-goal.policy';
import { TaskGoalBindingTrigger } from '@memoflow/contracts/task';

/**
 * Create Task Template Service
 */
export class CreateTaskTemplateUseCase {
  private readonly generationService: TaskInstanceGenerationService;
  private readonly logger = createLogger('CreateTaskTemplateUseCase');
  private readonly transactionRunner: TaskWriteTransactionRunner;

  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
    transactionRunner: TaskWriteTransactionRunner,
  ) {
    if (!transactionRunner) {
      throw new Error('TaskWriteTransactionRunner must be explicitly provided to CreateTaskTemplateUseCase');
    }
    this.generationService = new TaskInstanceGenerationService();
    this.transactionRunner = transactionRunner;
  }

  async execute(
    request: CreateTaskTemplateInput,
  ): Promise<Result<CreateTaskTemplateRes>> {
    try {
      return await this.transactionRunner.run(async ({ templateRepository, instanceRepository }) => {
        if (request.parentTaskId) {
          const parentTemplate = await templateRepository!.findByIdForIdentity(
            request.identityId,
            request.parentTaskId,
          );
          if (!parentTemplate) {
            return error('BAD_REQUEST', `Parent task template ${request.parentTaskId} not found`);
          }
        }

        const timeConfig = TaskTimeConfig.fromDTO(request.timeConfig);
        const recurrenceRule = request.recurrenceRule
          ? RecurrenceRule.fromDTO(request.recurrenceRule)
          : undefined;
        const reminderConfig = request.reminderConfig
          ? TaskReminderConfig.fromDTO(request.reminderConfig)
          : undefined;

        if (
          request.goalBinding?.progressTrigger ===
            TaskGoalBindingTrigger.AllInstancesCompleted &&
          !isFiniteTaskPlan(request.taskType, recurrenceRule)
        ) {
          return error(
            'BAD_REQUEST',
            'Whole-plan goal progress requires an end date or maximum occurrence count',
          );
        }

        const template = TaskTemplate.create({
          identityId: request.identityId,
          title: request.name,
          description: request.description ?? undefined,
          taskType: request.taskType,
          timeConfig,
          recurrenceRule,
          reminderConfig,
          importance: request.importance,
          parentTaskId: request.parentTaskId ? TaskTemplateId.of(request.parentTaskId) : undefined,
          folderId: request.folderId ?? undefined,
          tags: request.tags,
          color: request.color ?? undefined,
          goalBinding: request.goalBinding
            ? {
                goalId: request.goalBinding.goalId,
                keyResultId: request.goalBinding.keyResultId,
                goalRecordValue: request.goalBinding.goalRecordValue,
                progressTrigger: request.goalBinding.progressTrigger,
              }
            : null,
        });

        // R2-5a 乐观锁：模板只保存一次。顺序：先 generate（内存更新
        // lastGeneratedDate），再 save 模板（持久化模板供实例 FK），
        // 最后 saveMany 实例。
        const instances =
          template.status === TaskTemplateStatus.Active
            ? this.generationService.generateInstances(template)
            : [];

        await templateRepository!.save(template);
        if (instances.length > 0) {
          await instanceRepository.saveMany(instances);
        }

        const generation = {
          instanceCount: instances.length,
          todayInstanceCreated: instances.some((instance) => {
            if (!Number.isFinite(instance.instanceDate)) return false;
            const d = new Date(instance.instanceDate);
            const now = new Date();
            return (
              d.getFullYear() === now.getFullYear() &&
              d.getMonth() === now.getMonth() &&
              d.getDate() === now.getDate()
            );
          }),
        };

        return ok({
          template: template.toClientDTO(),
          ...generation,
        });
      });
    } catch (caughtError) {
      // eslint-disable-next-line no-console
      console.error('[CreateTaskTemplate] failed', {
        message: caughtError instanceof Error ? caughtError.message : String(caughtError),
        code: (caughtError as { code?: string }).code,
        meta: (caughtError as { meta?: unknown }).meta,
        stack: caughtError instanceof Error ? caughtError.stack?.split('\n').slice(0, 6).join('\n') : undefined,
      });
      this.logger.error('Failed to create task template', { error: caughtError });
      return fail(
        mapTaskWriteErrorToResultError(caughtError, 'Failed to create task template'),
      );
    }
  }

}
