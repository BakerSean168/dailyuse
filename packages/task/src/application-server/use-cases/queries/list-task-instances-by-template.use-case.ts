/**
 * List Task Instances By Template Service
 */

import type { ITaskInstanceRepository } from '@/domain-server/repositories/i-task-instance-repository';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class ListTaskInstancesByTemplateUseCase {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(templateId: string): Promise<Result<TaskInstanceClientDTO[]>> {
    const instances = await this.instanceRepository.findByTemplateId(templateId);
    return ok(instances.map((i) => i.toClientDTO()));
  }
}
