/**
 * List Reminder Templates Service
 *
 * 获取提醒模板列表
 */

import type {
  IReminderTemplateRepository,
  ReminderTemplate,
} from '@/domain-server';
import type {
  QueryReminderTemplatesRequest,
  ReminderTemplateListDTO,
} from '@dailyuse/contracts/reminder';
// import { ReminderContainer } from '@dailyuse/reminder/infrastructure-server';

/**
 * List Reminder Templates Service
 */
export class ListReminderTemplates {
  constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  async execute(
    accountUuid: string,
    query?: QueryReminderTemplatesRequest,
  ): Promise<ReminderTemplateListDTO> {
    let templates: ReminderTemplate[];

    if (query?.groupUuid) {
      templates = await this.templateRepository.findByGroupUuid(query.groupUuid, {
        includeHistory: false,
      });
    } else if (query?.effectiveEnabled) {
      templates = await this.templateRepository.findActive(accountUuid);
    } else {
      templates = await this.templateRepository.findByAccountUuid(accountUuid, {
        includeHistory: false,
      });
    }

    return {
      templates: templates.map((t) => t.toClientDTO()),
      total: templates.length,
    };
  }
}
