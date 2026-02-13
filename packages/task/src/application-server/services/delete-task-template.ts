/**
 * Delete Task Template Service
 *
 * 鍒犻櫎浠诲姟妯℃澘
 */

import type { ITaskTemplateRepository } from '../../domain-server/repositories/ITaskTemplateRepository';
import { eventBus } from '@dailyuse/utils';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Delete Task Template Service
 */
export class DeleteTaskTemplate {
  constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  async execute(uuid: string, soft = false): Promise<Result<{ success: boolean }>> {
    const template = await this.templateRepository.findById(uuid);
    if (!template) {
      // 骞傜瓑鎬э細濡傛灉妯℃澘涓嶅瓨鍦紝鐩存帴杩斿洖鎴愬姛
      return ok({ success: true });
    }

    if (soft) {
      await this.templateRepository.softDelete(uuid);
    } else {
      await this.templateRepository.delete(uuid);
    }

    // 鍙戝竷鍒犻櫎浜嬩欢
    try {
      await eventBus.publish({
        eventType: 'task.template.deleted',
        payload: {
          taskTemplateId: uuid,
          identityId: template.identityId,
          deletedAt: Date.now(),
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`锟?[DeleteTaskTemplate] 鍙戝竷鍒犻櫎浜嬩欢澶辫触:`, error);
    }

    return ok({ success: true });
  }
}

