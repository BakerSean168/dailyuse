import { 
  ReminderDomainService, 
  ReminderGroup,
} from '@/domain-server';
import type {
  IReminderTemplateRepository,
  IReminderGroupRepository,
  IReminderStatisticsRepository,
} from '@/domain-server';
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
 * @deprecated Use individual services instead
 * 
 * Reminder Application Service (Legacy)
 * This service is deprecated and kept for backward compatibility only.
 * 
 * Each operation has been extracted into its own service:
 * - CreateReminderTemplate: Create new reminder templates
 * - GetReminderTemplate: Retrieve single reminder template
 * - ListReminderTemplates: List templates with filtering
 * - UpdateReminderTemplate: Update existing templates
 * - DeleteReminderTemplate: Delete templates
 * 
 * This approach follows the Single Responsibility Principle and matches the
 * pattern established in the goal module, making each service easier to test,
 * maintain, and extend independently.
 * 
 * NEW CODE SHOULD NOT USE THIS SERVICE.
 * Use the individual services exported from index.ts instead.
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
    const template = await this.domainService.createReminderTemplate({
      title: params.title,
      description: params.description,
      type: params.type,
      trigger: params.triggerConfig || {} as any,
      activeTime: params.activeTimeConfig || {} as any,
      notificationConfig: params.notificationConfig || {} as any,
      recurrence: params.recurrenceConfig,
      activeHours: params.activeHoursConfig,
      groupUuid: params.groupUuid,
      importanceLevel: params.priority,
      accountUuid: params.accountUuid,
    });
    
    return template.toClientDTO();
  }

  async updateReminderTemplate(
    uuid: string, 
    request: UpdateReminderTemplateRequest
  ): Promise<ReminderTemplateClientDTO> {
    const template = await this.reminderTemplateRepository.findById(uuid);
    if (!template) {
      throw new Error(`Reminder Template ${uuid} not found`);
    }

    // Use domain entity's update method
    template.update({
      title: request.title,
      description: request.description,
      trigger: request.trigger,
      activeTime: request.activeTime,
      notificationConfig: request.notificationConfig,
      recurrence: request.recurrence,
      activeHours: request.activeHours,
      importanceLevel: request.importanceLevel,
      tags: request.tags,
      color: request.color,
      icon: request.icon,
      groupUuid: request.groupUuid,
    });
    
    await this.reminderTemplateRepository.save(template);
    return template.toClientDTO();
  }

  async deleteReminderTemplate(uuid: string): Promise<void> {
    await this.domainService.deleteTemplate(uuid);
  }

  async getReminderTemplate(uuid: string): Promise<ReminderTemplateClientDTO | null> {
    const template = await this.reminderTemplateRepository.findById(uuid);
    return template ? template.toClientDTO() : null;
  }

  async getReminderTemplatesByAccount(accountUuid: string): Promise<ReminderTemplateClientDTO[]> {
    const templates = await this.reminderTemplateRepository.findByAccountUuid(accountUuid);
    return templates.map((t: any) => t.toClientDTO());
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
    const groups = await this.reminderGroupRepository.findByAccountUuid(accountUuid);
    return groups.map((g: any) => g.toClientDTO());
  }

}

