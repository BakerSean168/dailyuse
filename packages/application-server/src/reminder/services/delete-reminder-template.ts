/**
 * Delete Reminder Template Service
 *
 * 删除提醒模板
 */

import type { IReminderTemplateRepository } from '@dailyuse/domain-server/reminder';
import { eventBus } from '@dailyuse/utils';
import { ReminderContainer } from '@dailyuse/infrastructure-server';

/**
 * Delete Reminder Template Service
 */
export class DeleteReminderTemplate {
  private static instance: DeleteReminderTemplate;

  private constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(templateRepository?: IReminderTemplateRepository): DeleteReminderTemplate {
    const container = ReminderContainer.getInstance();
    const repo = templateRepository || container.getTemplateRepository();
    DeleteReminderTemplate.instance = new DeleteReminderTemplate(repo);
    return DeleteReminderTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteReminderTemplate {
    if (!DeleteReminderTemplate.instance) {
      DeleteReminderTemplate.instance = DeleteReminderTemplate.createInstance();
    }
    return DeleteReminderTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteReminderTemplate.instance = undefined as unknown as DeleteReminderTemplate;
  }

  async execute(uuid: string, accountUuid: string): Promise<void> {
    const template = await this.templateRepository.findById(uuid);
    if (!template) {
      return; // 幂等性
    }

    // 直接通过仓储删除
    await this.templateRepository.delete(uuid);

    // 发布删除事件
    try {
      await eventBus.publish({
        eventType: 'reminder.template.deleted',
        payload: {
          reminderUuid: uuid,
          accountUuid: accountUuid,
          deletedAt: Date.now(),
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`❌ [DeleteReminderTemplate] 发布删除事件失败:`, error);
    }
  }
}
