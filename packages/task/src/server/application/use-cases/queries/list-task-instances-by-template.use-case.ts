/**
 * List Task Instances By Template Service
 */

import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class ListTaskInstancesByTemplateUseCase {
  constructor(
    private readonly instanceRepository: ITaskInstanceRepository,
    private readonly templateRepository: ITaskTemplateRepository,
  ) {}

  async execute(
    templateId: string,
    identityId: string,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    const template = await this.templateRepository.findByIdForIdentity(identityId, templateId);
    if (!template) {
      return ok([]);
    }

    const instances = await this.instanceRepository.findByTemplateId(templateId, identityId);
    return ok(instances.map((i) => i.toClientDTO()));
  }
}
