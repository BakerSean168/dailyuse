/**
 * Get Reminder Template Service
 *
 * 获取提醒模板详情
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IReminderTemplateRepository } from '../../../domain/repositories/i-reminder-template-repository';
import type { IReminderGroupRepository } from '../../../domain/repositories/i-reminder-group-repository';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { ReminderDomainService } from '../../../domain/services/reminder-domain-service';
import { ReminderTemplateClientMapper } from '../../mappers/reminder-template-client.mapper';

/**
 * Get Reminder Template Service
 */
export class GetReminderTemplateUseCase {
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

  async execute(id: string, cx: ExecutionContext): Promise<Result<ReminderTemplateClientDTO>> {
    const template = await this.templateRepository.findByIdForIdentity(cx.identityId, id, {
      includeHistory: true,
    });
    if (!template) {
      return error('NOT_FOUND', `Template ${id} not found`);
    }
    return ok(await this.templateMapper.toDTO(template));
  }
}
