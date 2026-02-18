/**
 * List Task Instances By Template Service
 */

import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class ListTaskInstancesByTemplate {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(templateId: string): Promise<Result<TaskInstanceClientDTO[]>> {
    const instances = await this.instanceRepository.findByTemplateId(templateId);
    return ok(instances.map((i) => i.toClientDTO()));
  }
}
