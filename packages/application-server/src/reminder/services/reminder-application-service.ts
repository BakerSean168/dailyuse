import { 
  ReminderDomainService, 
  ReminderGroup,
} from '@dailyuse/domain-server/reminder';
import type {
  IReminderTemplateRepository,
  IReminderGroupRepository,
  IReminderStatisticsRepository,
} from '@dailyuse/domain-server/reminder';
import type { 
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  ReminderType,
  TriggerType,
  UpdateReminderTemplateRequest,
  TriggerConfigServerDTO,
  ActiveTimeConfigServerDTO,
  NotificationConfigServerDTO,
  RecurrenceConfigServerDTO,
  ActiveHoursConfigServerDTO,
} from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderApplicationService');

/**
 * Reminder Application Service
 * Responsible for coordinating domain services and repositories to handle reminder cases.
 */
export class ReminderApplicationService {
  private domainService: ReminderDomainService;

  constructor(
    private reminderTemplateRepository: IReminderTemplateRepository,
    private reminderGroupRepository: IReminderGroupRepository,
    private reminderStatisticsRepository: IReminderStatisticsRepository
  ) {
    this.domainService = new ReminderDomainService(
      reminderTemplateRepository,
      reminderGroupRepository,
      reminderStatisticsRepository
    );
  }

  // ===== Reminder Template Management =====

  async createReminderTemplate(params: {
    title: string;
    description?: string;
    type: ReminderType;
    triggerType: TriggerType;
    triggerConfig?: TriggerConfigServerDTO;
    activeTimeConfig?: ActiveTimeConfigServerDTO;
    notificationConfig?: NotificationConfigServerDTO;
    recurrenceConfig?: RecurrenceConfigServerDTO;
    activeHoursConfig?: ActiveHoursConfigServerDTO;
    groupUuid?: string;
    priority?: ImportanceLevel;
    accountUuid: string;
  }): Promise<ReminderTemplateClientDTO> {
    const template = await this.domainService.createTemplate({
      title: params.title,
      description: params.description,
      type: params.type,
      triggerType: params.triggerType,
      triggerConfig: params.triggerConfig,
      activeTimeConfig: params.activeTimeConfig,
      notificationConfig: params.notificationConfig,
      recurrenceConfig: params.recurrenceConfig,
      activeHoursConfig: params.activeHoursConfig,
      groupUuid: params.groupUuid,
      priority: params.priority,
      accountUuid: params.accountUuid,
    });
    
    return template.toClientDTO();
  }

  async updateReminderTemplate(
      uuid: string, 
      request: UpdateReminderTemplateRequest
  ): Promise<ReminderTemplateClientDTO> {
    const template = await this.reminderTemplateRepository.findByUuid(uuid);
    if (!template) {
        throw new Error(`Reminder Template ${uuid} not found`);
    }

    // Map request to domain entity update
    // Simplified for refactor - ideally delegated to domain or mapped carefully
    if (request.title !== undefined) template.title = request.title;
    if (request.description !== undefined) template.description = request.description;
    
    // ... map other fields ...
    
    await this.reminderTemplateRepository.save(template);
    return template.toClientDTO();
  }

  async deleteReminderTemplate(uuid: string): Promise<void> {
    await this.reminderTemplateRepository.delete(uuid);
  }

  async getReminderTemplate(uuid: string): Promise<ReminderTemplateClientDTO | null> {
    const template = await this.reminderTemplateRepository.findByUuid(uuid);
    return template ? template.toClientDTO() : null;
  }

  async getReminderTemplatesByAccount(accountUuid: string): Promise<ReminderTemplateClientDTO[]> {
    const templates = await this.reminderTemplateRepository.findByAccount(accountUuid);
    return templates.map(t => t.toClientDTO());
  }

  // ===== Reminder Group Management =====

  async createReminderGroup(params: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    accountUuid: string;
  }): Promise<ReminderGroupClientDTO> {
    const group = ReminderGroup.create({
      name: params.name,
      description: params.description,
      color: params.color,
      icon: params.icon,
      accountUuid: params.accountUuid,
    });
    await this.reminderGroupRepository.save(group);
    return group.toClientDTO();
  }

  async getReminderGroupsByAccount(accountUuid: string): Promise<ReminderGroupClientDTO[]> {
    const groups = await this.reminderGroupRepository.findByAccount(accountUuid);
    return groups.map(g => g.toClientDTO());
  }

}

