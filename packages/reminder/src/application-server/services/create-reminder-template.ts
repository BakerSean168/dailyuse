/**
 * Create Reminder Template Service
 *
 * 创建提醒模板
 */

import type { IReminderTemplateRepository } from '../../domain-server/repositories/IReminderTemplateRepository';
import type { IReminderGroupRepository } from '../../domain-server/repositories/IReminderGroupRepository';
import type { IReminderStatisticsRepository } from '../../domain-server/repositories/IReminderStatisticsRepository';
import { ReminderDomainService } from '../../domain-server/services/ReminderDomainService';
import type {
  ReminderTemplateClientDTO,
  CreateReminderTemplateRequest,
} from '@dailyuse/contracts/reminder';
import { eventBus } from '@dailyuse/utils';
// import { ReminderContainer } from '@dailyuse/reminder/infrastructure-server';

/**
 * Create Reminder Template Service
 */
export class CreateReminderTemplate {
  private readonly domainService: ReminderDomainService;

  constructor(
    templateRepository: IReminderTemplateRepository,
    groupRepository: IReminderGroupRepository,
    statisticsRepository: IReminderStatisticsRepository,
  ) {
    this.domainService = new ReminderDomainService(
      templateRepository,
      groupRepository,
      statisticsRepository,
    );
  }

  async execute(accountUuid: string, input: CreateReminderTemplateRequest): Promise<ReminderTemplateClientDTO> {
    const template = await this.domainService.createReminderTemplate({ accountUuid, ...input });

    // 发布领域事件
    const events = template.getDomainEvents();
    for (const event of events) {
      const payload = event.payload as Record<string, unknown>;
      await eventBus.publish({
        ...event,
        payload: {
          ...payload,
          reminderData: template.toServerDTO(),
        },
      });
    }

    return template.toClientDTO();
  }
}
