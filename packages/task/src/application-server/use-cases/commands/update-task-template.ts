/**
 * Update Task Template Service
 */

import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import { RecurrenceRule } from '@/domain-server/value-objects';
import type { UpdateTaskTemplateReq, TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class UpdateTaskTemplate {
  constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  async execute(
    id: string,
    request: Partial<UpdateTaskTemplateReq>,
  ): Promise<Result<TaskTemplateClientDTO>> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      return error('NOT_FOUND', `TaskTemplate ${id} not found`);
    }

    if (request.name !== undefined) {
      template.updateTitle(request.name);
    }

    if (request.description !== undefined) {
      template.updateDescription(request.description ?? null);
    }

    if (request.importance !== undefined) {
      template.updatePriority(request.importance);
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

    await this.templateRepository.save(template);

    return ok(template.toClientDTO());
  }
}
