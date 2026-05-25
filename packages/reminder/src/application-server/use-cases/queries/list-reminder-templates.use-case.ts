/**
 * List Reminder Templates Service
 *
 * 获取提醒模板列表
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IReminderTemplateRepository } from '@/domain-server/repositories/i-reminder-template-repository';
import type { ReminderTemplate } from '@/domain-server/aggregates/reminder-template';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';

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
export class ListReminderTemplatesUseCase {
  constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  async execute(
    query: ListReminderTemplatesQuery | undefined,
    cx: ExecutionContext,
  ): Promise<Result<ReminderTemplateListResult>> {
    let templates: ReminderTemplate[];

    if (query?.groupId) {
      templates = await this.templateRepository.findByGroupId(query.groupId, {
        includeHistory: false,
      });
    } else if (query?.effectiveEnabled) {
      templates = await this.templateRepository.findActive(cx.identityId);
    } else {
      templates = await this.templateRepository.findByIdentityId(cx.identityId, {
        includeHistory: false,
      });
    }

    return ok({
      templates: templates.map((t) => t.toClientDTO()),
      total: templates.length,
    });
  }
}
