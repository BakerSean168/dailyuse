/**
 * Delete Task Template Service
 *
 * 鍒犻櫎浠诲姟妯℃澘
 */

import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Delete Task Template Service
 */
export class DeleteTaskTemplateUseCase {
  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {}

  async execute(id: string, soft = false): Promise<Result<{ success: boolean }>> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      // 骞傜瓑鎬э細濡傛灉妯℃澘涓嶅瓨鍦紝鐩存帴杩斿洖鎴愬姛
      return ok({ success: true });
    }

    template.softDelete();
    await this.templateRepository.save(template);
    await this.instanceRepository.deleteByTemplateId(id);

    if (!soft) {
      await this.templateRepository.delete(id);
    }

    return ok({ success: true });
  }
}
