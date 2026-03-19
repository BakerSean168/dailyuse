/**
 * Delete Task Template Service
 *
 * 鍒犻櫎浠诲姟妯℃澘
 */

import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import { eventBus } from '@dailyuse/utils';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Delete Task Template Service
 */
export class DeleteTaskTemplate {
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

    if (soft) {
      await this.instanceRepository.deleteByTemplateId(id);
      await this.templateRepository.softDelete(id);
    } else {
      await this.instanceRepository.deleteByTemplateId(id);
      await this.templateRepository.delete(id);
    }

    // 鍙戝竷鍒犻櫎浜嬩欢
    try {
      eventBus.send('task:template:deleted' as any, {
        aggregateId: id,
        taskTemplateId: id,
        identityId: template.identityId,
        deletedAt: Date.now(),
      });
    } catch (error) {
      console.error(`锟?[DeleteTaskTemplate] 鍙戝竷鍒犻櫎浜嬩欢澶辫触:`, error);
    }

    return ok({ success: true });
  }
}
