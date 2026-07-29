/**
 * List Reminder Templates Service
 *
 * 获取提醒模板列表
 */

import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { IReminderTemplateRepository } from '../../../domain/repositories/i-reminder-template-repository';
import type { IReminderGroupRepository } from '../../../domain/repositories/i-reminder-group-repository';
import type { ReminderTemplateListRes } from '@memoflow/contracts/reminder';
import { ReminderDomainService } from '../../../domain/services/reminder-domain-service';
import { ReminderTemplateClientMapper } from '../../mappers/reminder-template-client.mapper';

export interface ListReminderTemplatesQuery {
  groupId?: string;
  effectiveEnabled?: boolean;
}

/**
 * List Reminder Templates Service
 */
export class ListReminderTemplatesUseCase {
  private readonly templateMapper: ReminderTemplateClientMapper;

  constructor(
    private readonly templateRepository: IReminderTemplateRepository,
    groupRepository: IReminderGroupRepository,
    templateMapper?: ReminderTemplateClientMapper,
  ) {
    this.templateMapper =
      templateMapper ??
      new ReminderTemplateClientMapper(
        new ReminderDomainService(templateRepository, groupRepository),
        groupRepository,
      );
  }

  async execute(
    query: ListReminderTemplatesQuery | undefined,
    cx: ExecutionContext,
  ): Promise<Result<ReminderTemplateListRes>> {
    let templates;

    if (query?.groupId) {
      templates = await this.templateRepository.findByGroupId(query.groupId, cx.identityId, {
        includeHistory: true,
        historyLimit: 1,
      });
    } else if (query?.effectiveEnabled) {
      templates = await this.templateRepository.findActive(cx.identityId, {
        includeHistory: true,
        historyLimit: 1,
      });
    } else {
      templates = await this.templateRepository.findByIdentityId(cx.identityId, {
        includeHistory: true,
        historyLimit: 1,
      });
    }

    const data = await this.templateMapper.toDTOList(templates);

    return ok({
      templates: data,
      total: data.length,
      page: 1,
      pageSize: data.length,
      hasMore: false,
    });
  }
}
