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
import { ReminderContainer } from '@dailyuse/infrastructure-server';

/**
 * Create Reminder Template Service
 */
export class CreateReminderTemplate {
  private static instance: CreateReminderTemplate;
  private readonly domainService: ReminderDomainService;

  private constructor(
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

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(
    templateRepository?: IReminderTemplateRepository,
    groupRepository?: IReminderGroupRepository,
    statisticsRepository?: IReminderStatisticsRepository,
  ): CreateReminderTemplate {
    const container = ReminderContainer.getInstance();
    const templateRepo = templateRepository || container.getTemplateRepository();
    const groupRepo = groupRepository || container.getGroupRepository();
    const statsRepo = statisticsRepository || container.getStatisticsRepository();
    CreateReminderTemplate.instance = new CreateReminderTemplate(templateRepo, groupRepo, statsRepo);
    return CreateReminderTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateReminderTemplate {
    if (!CreateReminderTemplate.instance) {
      CreateReminderTemplate.instance = CreateReminderTemplate.createInstance();
    }
    return CreateReminderTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateReminderTemplate.instance = undefined as unknown as CreateReminderTemplate;
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
