/**
 * Pause Task Template Service
 *
 * 鏆傚仠浠诲傚仠浠诲姟妯℃澘
 * 涓氬姟閫昏緫锛?
 * 1. 淇敼妯℃澘鐘舵€佷负 PAUSED
 * 2. 鍋滄鐢熸垚鏂扮殑浠诲姟瀹炰緥
 * 3. 澶勭悊宸插瓨鍦ㄧ殑鏈畬鎴愬疄渚嬶紙鏍囪涓?SKIPPED锛?
 * 4. 鍙戝竷鏆傚仠浜嬩欢锛岃Е鍙戞彁閱掕皟搴︽殏锟?
 */

import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Pause Task Template Service
 */
export class PauseTaskTemplateUseCase {
  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {}

  async execute(
    id: string,
    reason?: string,
  ): Promise<Result<{ template: TaskTemplateClientDTO; instancesDeleted: number }>> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      return error('NOT_FOUND', `TaskTemplate ${id} not found`);
    }

    const effectiveFrom = Date.now();

    // 1. 暂停模板
    template.pause();
    await this.templateRepository.save(template);

    // 2. 删除生效时点之后未完成的实例
    const instancesDeleted = await this.deleteIncompleteInstancesFrom(id, effectiveFrom);

    return ok({
      template: template.toClientDTO(),
      instancesDeleted,
    });
  }

  /**
   * 删除暂停生效时点之后未完成的实例
   */
  private async deleteIncompleteInstancesFrom(
    templateId: string,
    effectiveFrom: number,
  ): Promise<number> {
    try {
      return await this.instanceRepository.deleteIncompleteInstancesFrom(templateId, effectiveFrom);
    } catch (error) {
      console.error('[PauseTaskTemplateUseCase] Failed to delete incomplete instances:', error);
      return 0;
    }
  }
}
