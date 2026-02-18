/**
 * List Reminder Templates Service
 *
 * 获取提醒模板列表
 */

import type { IReminderTemplateRepository } from '@/domain-server/repositories/IReminderTemplateRepository';
import type { ReminderTemplate } from '@/domain-server/aggregates/reminder-template';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
// import { ReminderContainer } from '@dailyuse/reminder/infrastructure-server';

export interface ListReminderTemplatesQuery {
  groupId?: string;
  effectiveEnabled?: boolean;
}

export interface ReminderTemplateListResult {
  templates: ReminderTemplateClientDTO[];
  total: number;
}

/**
 * List Reminder Templates Service
 */
export class ListReminderTemplates {
  constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  async execute(
    identityId: string,
    query?: ListReminderTemplatesQuery,
  ): Promise<ReminderTemplateListResult> {
    let templates: ReminderTemplate[];

    if (query?.groupId) {
      templates = await this.templateRepository.findByGroupId(query.groupId, {
        includeHistory: false,
      });
    } else if (query?.effectiveEnabled) {
      templates = await this.templateRepository.findActive(identityId);
    } else {
      templates = await this.templateRepository.findByIdentityId(identityId, {
        includeHistory: false,
      });
    }

    return {
      templates: templates.map((t) => t.toClientDTO()),
      total: templates.length,
    };
  }
}
