/**
 * Pause Task Template Service
 *
 * 鏆傚仠浠诲姟妯℃澘
 * 涓氬姟閫昏緫锛?
 * 1. 淇敼妯℃澘鐘舵€佷负 PAUSED
 * 2. 鍋滄鐢熸垚鏂扮殑浠诲姟瀹炰緥
 * 3. 澶勭悊宸插瓨鍦ㄧ殑鏈畬鎴愬疄渚嬶紙鏍囪涓?SKIPPED锛?
 * 4. 鍙戝竷鏆傚仠浜嬩欢锛岃Е鍙戞彁閱掕皟搴︽殏锟?
 */

import type { ITaskTemplateRepository } from '../../domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '../../domain-server/repositories/ITaskInstanceRepository';
import type { TaskTemplateClientDTO, TaskTemplateResponse } from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Pause Task Template Service
 */
export class PauseTaskTemplate {
  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {}

  async execute(
    uuid: string,
    reason?: string,
  ): Promise<Result<{ template: TaskTemplateClientDTO; instancesSkipped: number }>> {
    const template = await this.templateRepository.findById(uuid);
    if (!template) {
      return error('NOT_FOUND', `TaskTemplate ${uuid} not found`);
    }

    // 1. 鏆傚仠妯℃澘鐘讹拷?
    template.pause();
    await this.templateRepository.save(template);

    // 2. 澶勭悊鏈畬鎴愮殑浠诲姟瀹炰緥
    const instancesSkipped = await this.handleInstancesOnPause(uuid);

    // 3. 鍙戝竷鏆傚仠浜嬩欢
    try {
      await eventBus.publish({
        eventType: 'task.template.paused',
        payload: {
          taskTemplateId: template.id,
          identityId: template.identityId,
          pausedAt: Date.now(),
          reason: reason || '鐢ㄦ埛鎵嬪姩鏆傚仠',
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`锟?[PauseTaskTemplate] 鍙戝竷鏆傚仠浜嬩欢澶辫触:`, error);
    }

    return ok({
      template: template.toClientDTO(),
      instancesSkipped,
    });
  }

  /**
   * 澶勭悊鏆傚仠鏃剁殑浠诲姟瀹炰緥
   */
  private async handleInstancesOnPause(templateId: string): Promise<number> {
    try {
      const instances = await this.instanceRepository.findByTemplateId(templateId);
      const pendingInstances = instances.filter(
        (inst) => inst.status === 'PENDING' || inst.status === 'IN_PROGRESS',
      );

      if (pendingInstances.length === 0) {
        return 0;
      }

      for (const instance of pendingInstances) {
        instance.skip('妯℃澘宸叉殏鍋?);
        await this.instanceRepository.save(instance);
      }

      return pendingInstances.length;
    } catch (error) {
      console.error(`[PauseTaskTemplate] 澶勭悊瀹炰緥澶辫触:`, error);
      return 0;
    }
  }
}
