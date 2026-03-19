/**
 * Get Task Template Service
 *
 * 鑾峰彇浠诲姟妯℃澘璇︽儏
 */

import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import type { GetTaskTemplateRes } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Get Task Template Service
 */
export class GetTaskTemplate {
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
      const instances = (await this.instanceRepository.findByTemplateId(id)) ?? [];
      const completedCount = instances.filter((instance) => instance.status === 'Completed').length;
      const totalCount = instances.length;

      dto.instanceCount = totalCount;
      dto.completedInstanceCount = completedCount;
      dto.pendingInstanceCount = instances.filter(
        (instance) => instance.status === 'Pending',
      ).length;
      dto.completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    }

    return ok(dto);
  }
}
