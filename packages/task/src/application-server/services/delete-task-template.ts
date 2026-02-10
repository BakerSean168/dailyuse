/**
 * Delete Task Template Service
 *
 * 删除任务模板
 */

import type { ITaskTemplateRepository } from '@/domain-server';
import { eventBus } from '@dailyuse/utils';

/**
 * Delete Task Template Service
 */
export class DeleteTaskTemplate {
  constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  async execute(uuid: string, soft = false): Promise<{ success: boolean }> {
    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      // 幂等性：如果模板不存在，直接返回成功
      return { success: true };
    }

    if (soft) {
      await this.templateRepository.softDelete(uuid);
    } else {
      await this.templateRepository.delete(uuid);
    }

    // 发布删除事件
    try {
      await eventBus.publish({
        eventType: 'task.template.deleted',
        payload: {
          taskTemplateUuid: uuid,
          accountUuid: template.accountUuid,
          deletedAt: Date.now(),
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`�?[DeleteTaskTemplate] 发布删除事件失败:`, error);
    }

    return { success: true };
  }
}

