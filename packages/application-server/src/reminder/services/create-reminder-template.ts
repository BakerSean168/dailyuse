/**
 * Create Reminder Template Service
 *
 * 创建提醒模板
 */

import type {
  IReminderTemplateRepository,
  IReminderGroupRepository,
  IReminderStatisticsRepository,
} from '@dailyuse/domain-server/reminder';
import { ReminderDomainService } from '@dailyuse/domain-server/reminder';
import type {
  ReminderTemplateClientDTO,
  CreateReminderTemplateRequest,
} from '@dailyuse/contracts/reminder';
import { eventBus } from '@dailyuse/utils';
// import { ReminderContainer } from '@dailyuse/infrastructure-server';

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
