/**
 * Get Task Template Service
 *
 * 鑾峰彇浠诲鑾峰彇浠诲姟妯℃澘璇︽儏
 */

import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import { TaskInstanceStatus } from '../../../domain/value-objects';
import type { GetTaskTemplateRes } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Get Task Template Service
 */
export class GetTaskTemplateUseCase {
  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {}

  async execute(id: string, includeChildren = false): Promise<Result<GetTaskTemplateRes>> {
    const template = includeChildren
      ? await this.templateRepository.findByIdWithChildren(id)
      : await this.templateRepository.findById(id);

    if (!template) {
      return ok(null);
    }

    const dto = template.toClientDTO(includeChildren);

    if (!includeChildren) {
      let stats = ((await this.instanceRepository.getTemplateStats([id])) ?? {})[id];

      if (!stats) {
        const instances = (await this.instanceRepository.findByTemplateId(id)) ?? [];
        const completedInstanceCount = instances.filter(
          (instance) => instance.status === TaskInstanceStatus.Completed,
        ).length;
        const pendingInstanceCount = instances.filter(
          (instance) => instance.status === TaskInstanceStatus.Pending,
        ).length;
        const instanceCount = instances.length;

        stats = {
          templateId: id,
          instanceCount,
          completedInstanceCount,
          pendingInstanceCount,
          completionRate:
            instanceCount > 0 ? Math.round((completedInstanceCount / instanceCount) * 100) : 0,
        };
      }

      dto.instanceCount = stats?.instanceCount ?? 0;
      dto.completedInstanceCount = stats?.completedInstanceCount ?? 0;
      dto.pendingInstanceCount = stats?.pendingInstanceCount ?? 0;
      dto.completionRate = stats?.completionRate ?? 0;
    }

    return ok(dto);
  }
}
