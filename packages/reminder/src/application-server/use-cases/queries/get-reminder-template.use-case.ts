/**
 * Get Reminder Template Service
 *
 * 获取提醒模板详情
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IReminderTemplateRepository } from '@/domain-server/repositories/i-reminder-template-repository';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';

/**
 * Get Reminder Template Service
 */
export class GetReminderTemplateUseCase {

  constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  async execute(id: string): Promise<Result<ReminderTemplateClientDTO | null>> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      return error('NOT_FOUND', `Template ${id} not found`);
    }
    return ok(template.toClientDTO());
  }
}
