/**
 * Update Task Template Service
 */

import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import { RecurrenceRule } from '../../../domain/value-objects/recurrence-rule';
import { TaskTimeConfig } from '../../../domain/value-objects/task-time-config';
import { TaskReminderConfig } from '../../../domain/value-objects/task-reminder-config';
import { TaskTemplateId } from '../../../domain/value-objects/task-template-id';
import type { UpdateTaskTemplateReq, TaskTemplateClientDTO } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';

export class UpdateTaskTemplateUseCase {
  constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  async execute(
    id: string,
    identityId: string,
    request: Partial<UpdateTaskTemplateReq>,
  ): Promise<Result<TaskTemplateClientDTO>> {
    const template = await this.templateRepository.findByIdForIdentity(identityId, id);
    if (!template) {
      return error('NOT_FOUND', `TaskTemplate ${id} not found`);
    }

    if (request.parentTaskId !== undefined) {
      const parentValidation = await this.validateParentTask(
        id,
        identityId,
        request.parentTaskId ?? null,
      );
      if (!parentValidation.ok) {
        return parentValidation;
      }
    }

    if (request.name !== undefined) {
      template.updateTitle(request.name);
    }

    if (request.description !== undefined) {
      template.updateDescription(request.description ?? null);
    }

    if (request.timeConfig !== undefined) {
      const nextTimeConfig = request.timeConfig ? TaskTimeConfig.fromDTO(request.timeConfig) : null;
      template.updateTimeConfig(nextTimeConfig);
    }

    if (request.importance !== undefined) {
      template.updatePriority(request.importance);
    }

    if (request.parentTaskId !== undefined) {
      template.updateParentTaskId(
        request.parentTaskId ? TaskTemplateId.of(request.parentTaskId) : null,
      );
    }

    if (request.tags !== undefined) {
      template.updateTags(request.tags);
    }

    if (request.color !== undefined) {
      template.updateColor(request.color ?? null);
    }

    if (request.recurrenceRule !== undefined && request.recurrenceRule !== null) {
      template.updateRecurrenceRule(RecurrenceRule.fromDTO(request.recurrenceRule));
    }

    if (request.reminderConfig !== undefined) {
      const nextReminderConfig = request.reminderConfig
        ? TaskReminderConfig.fromDTO(request.reminderConfig)
        : null;
      template.updateReminderConfig(nextReminderConfig);
    }

    if (request.goalBinding !== undefined) {
      if (request.goalBinding === null) {
        if (template.goalBinding) {
          template.unbindFromGoal();
        }
      } else {
        template.bindToGoal(
          request.goalBinding.goalId,
          request.goalBinding.keyResultId,
          request.goalBinding.goalRecordValue,
          request.goalBinding.progressTrigger,
        );
      }
    }

    await this.templateRepository.save(template);

    return ok(template.toClientDTO());
  }

  private async validateParentTask(
    templateId: string,
    identityId: string,
    parentTaskId: string | null,
  ): Promise<Result<void>> {
    if (!parentTaskId) {
      return ok(undefined);
    }

    if (parentTaskId === templateId) {
      return error('BAD_REQUEST', 'Task cannot be its own parent');
    }

    const visited = new Set<string>();
    let currentParentId: string | null = parentTaskId;

    while (currentParentId) {
      if (currentParentId === templateId) {
        return error('BAD_REQUEST', 'Parent task would create a hierarchy cycle');
      }

      if (visited.has(currentParentId)) {
        return error('BAD_REQUEST', 'Detected an existing hierarchy cycle in parent tasks');
      }

      visited.add(currentParentId);

      const parentTemplate = await this.templateRepository.findByIdForIdentity(
        identityId,
        currentParentId,
      );
      if (!parentTemplate) {
        return error('BAD_REQUEST', `Parent task template ${currentParentId} not found`);
      }

      currentParentId = parentTemplate.parentTaskId ? String(parentTemplate.parentTaskId) : null;
    }

    return ok(undefined);
  }
}
