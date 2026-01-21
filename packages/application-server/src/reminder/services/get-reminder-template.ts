/**
 * Get Reminder Template Service
 *
 * 获取提醒模板详情
 */

import type { IReminderTemplateRepository } from '@dailyuse/domain-server/reminder';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
// import { ReminderContainer } from '@dailyuse/infrastructure-server';

/**
 * Get Reminder Template Service
 */
export class GetReminderTemplate {
  
  constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetReminderTemplate.instance = undefined as unknown as GetReminderTemplate;
  }

  async execute(uuid: string): Promise<ReminderTemplateClientDTO | null> {
    const template = await this.templateRepository.findById(uuid);
    return template ? template.toClientDTO() : null;
  }
}
