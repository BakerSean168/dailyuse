/**
 * Archive Task Template Service
 */

import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class ArchiveTaskTemplateUseCase {
  constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  async execute(id: string, identityId: string): Promise<Result<TaskTemplateClientDTO>> {
    const template = await this.templateRepository.findByIdForIdentity(identityId, id);
    if (!template) {
      return error('NOT_FOUND', `TaskTemplate ${id} not found`);
    }

    template.archive();
    await this.templateRepository.save(template);

    return ok(template.toClientDTO());
  }
}
