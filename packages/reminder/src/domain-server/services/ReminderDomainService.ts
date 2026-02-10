import type { ActiveHoursConfigServerDTO, ActiveTimeConfigServerDTO, NotificationConfigServerDTO, RecurrenceConfigServerDTO, TriggerConfigServerDTO } from '@dailyuse/contracts/reminder';
import { ControlMode, ReminderType } from '@dailyuse/contracts/reminder';
import type {
  IReminderGroupRepository,
  IReminderTemplateRepository,
} from '../repositories';
import { ReminderTemplate } from '../aggregates/reminder-template';
import { ReminderGroup } from '../aggregates/reminder-group';
import { ReminderTemplateControlService } from './ReminderTemplateControlService';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

// Local branded type
type IdentityId = string & { readonly __brand: 'IdentityId' };

/**
 * Reminder Domain Service
 *
 * 核心职责：
 * - 编排和协调 Reminder 模块内的多个聚合根和实体。
 * - 处理跨聚合的复杂业务规则和不变量。
 * - 封装核心业务流程，供 Application Service 调用。
 *
 * 关键原则：
 * - 无状态：领域服务自身不持有状态，所有状态通过仓储加载和持久化。
 * - 依赖于抽象：依赖于仓储接口（IRepository），而不是具体实现。
 * - 业务逻辑的内聚中心：将分散在应用服务中的业务逻辑下沉到此。
 */
export class ReminderDomainService {
  private readonly controlService: ReminderTemplateControlService;

  constructor(
    private readonly reminderTemplateRepository: IReminderTemplateRepository,
    private readonly reminderGroupRepository: IReminderGroupRepository,
  ) {
    this.controlService = new ReminderTemplateControlService(
      reminderTemplateRepository,
      reminderGroupRepository,
    );
  }

  /**
   * 获取模板控制服务（供应用层使用）
   */
  public getControlService(): ReminderTemplateControlService {
    return this.controlService;
  }

  // --- ReminderTemplate Methods ---

  public async createReminderTemplate(params: {
    accountUuid: string;
    title: string;
    type: ReminderType;
    trigger: TriggerConfigServerDTO;
    activeTime: ActiveTimeConfigServerDTO;
    notificationConfig: NotificationConfigServerDTO;
    description?: string;
    recurrence?: RecurrenceConfigServerDTO;
    activeHours?: ActiveHoursConfigServerDTO;
    importanceLevel?: ImportanceLevel;
    tags?: string[];
    color?: string;
    icon?: string;
    groupUuid?: string;
  }): Promise<ReminderTemplate> {
    if (params.groupUuid) {
      const group = await this.reminderGroupRepository.findById(params.groupUuid);
      if (!group || group.identityId !== params.accountUuid) {
        throw new Error(`Invalid groupUuid: ${params.groupUuid}`);
      }
    }

    const template = ReminderTemplate.create({ ...params, identityId: params.accountUuid as IdentityId });
    await this.reminderTemplateRepository.save(template);

    // TODO: Update group stats if groupUuid is present
    if (params.groupUuid) {
      await this.updateGroupStats(params.groupUuid);
    }

    return template;
  }

  public async getTemplate(
    uuid: string,
    options?: { includeHistory?: boolean },
  ): Promise<ReminderTemplate | null> {
    return this.reminderTemplateRepository.findById(uuid, options);
  }

  public async deleteTemplate(uuid: string, softDelete: boolean = true): Promise<void> {
    const template = await this.getTemplate(uuid);
    if (!template) {
      throw new Error(`ReminderTemplate not found: ${uuid}`);
    }

    const groupUuid = template.groupUuid;

    if (softDelete) {
      template.softDelete();
      await this.reminderTemplateRepository.save(template);
    } else {
      await this.reminderTemplateRepository.delete(uuid);
    }

    if (groupUuid) {
      await this.updateGroupStats(groupUuid);
    }
  }

  // --- ReminderGroup Methods ---

  public async createReminderGroup(params: {
    accountUuid: string;
    name: string;
    controlMode?: ControlMode;
    description?: string;
    color?: string;
    icon?: string;
    order?: number;
  }): Promise<ReminderGroup> {
    const existingGroup = await this.reminderGroupRepository.findByName(
      params.accountUuid,
      params.name,
    );
    if (existingGroup) {
      throw new Error(`ReminderGroup with name "${params.name}" already exists.`);
    }

    const group = ReminderGroup.create({ ...params, identityId: params.accountUuid });
    await this.reminderGroupRepository.save(group);
    return group;
  }

  public async getGroup(uuid: string): Promise<ReminderGroup | null> {
    return this.reminderGroupRepository.findById(uuid);
  }

  public async deleteGroup(uuid: string, softDelete: boolean = true): Promise<void> {
    // Business Rule: Cannot delete a group that still contains templates.
    const templatesInGroup = await this.reminderTemplateRepository.findByGroupUuid(uuid);
    if (templatesInGroup.length > 0) {
      throw new Error(
        `Cannot delete group ${uuid} because it still contains ${templatesInGroup.length} templates.`,
      );
    }

    if (softDelete) {
      const group = await this.getGroup(uuid);
      if (group) {
        group.softDelete();
        await this.reminderGroupRepository.save(group);
      }
    } else {
      await this.reminderGroupRepository.delete(uuid);
    }
  }

  // --- Cross-Aggregate Methods ---

  public async assignTemplateToGroup(
    templateUuid: string,
    groupUuid: string | null,
  ): Promise<ReminderTemplate> {
    const template = await this.getTemplate(templateUuid);
    if (!template) {
      throw new Error(`ReminderTemplate not found: ${templateUuid}`);
    }

    const oldGroupUuid = template.groupUuid;

    if (groupUuid) {
      const group = await this.getGroup(groupUuid);
      if (!group || group.identityId !== template.identityId) {
        throw new Error(`Invalid groupUuid: ${groupUuid}`);
      }
    }

    // This logic should be on the aggregate
    // template.moveToGroup(groupUuid);
    const newTemplate = ReminderTemplate.fromServerDTO({
      ...template.toServerDTO(),
      groupUuid: groupUuid,
    });

    await this.reminderTemplateRepository.save(newTemplate);

    // Update stats for both old and new groups
    if (oldGroupUuid) {
      await this.updateGroupStats(oldGroupUuid);
    }
    if (groupUuid) {
      await this.updateGroupStats(groupUuid);
    }

    return newTemplate;
  }

  public async toggleGroupAndTemplates(uuid: string): Promise<ReminderGroup> {
    const group = await this.getGroup(uuid);
    if (!group) {
      throw new Error(`ReminderGroup not found: ${uuid}`);
    }

    group.toggle();
    await this.reminderGroupRepository.save(group);

    // If group control is active, update all templates within the group
    if (group.controlMode === ControlMode.Group) {
      const templates = await this.reminderTemplateRepository.findByGroupUuid(uuid);
      for (const template of templates) {
        if (group.enabled) {
          template.enable(); // This should check group status internally
        } else {
          template.pause();
        }
        await this.reminderTemplateRepository.save(template);
      }
    }

    return group;
  }

  public async updateGroupStats(groupUuid: string): Promise<void> {
    const group = await this.getGroup(groupUuid);
    if (!group) return;

    // This is a simplified stats update. A real implementation might use a
    // more efficient query.
    const templates = await this.reminderTemplateRepository.findByGroupUuid(groupUuid, {
      includeDeleted: false,
    });

    // This logic should be on the aggregate
    // group.updateStats({
    //   totalTemplates: templates.length,
    //   activeTemplates: templates.filter(t => t.status === 'ACTIVE').length,
    //   // ... other stats
    // });

    await group.updateStats(); // Assuming this method exists and does the calculation
    await this.reminderGroupRepository.save(group);
  }
}
