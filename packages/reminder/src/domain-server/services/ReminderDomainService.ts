import type {
  ActiveHoursConfigDTO,
  ActiveTimeConfigDTO,
  NotificationConfigDTO,
  TriggerConfigDTO,
} from '@dailyuse/contracts/reminder';
import { ControlMode, ReminderType } from '@dailyuse/contracts/reminder';
import type { IReminderGroupRepository, IReminderTemplateRepository } from '../repositories';
import { ReminderTemplate } from '../aggregates/reminder-template';
import { ReminderGroup } from '../aggregates/reminder-group';
import { ReminderTemplateControlService } from './ReminderTemplateControlService';
import { ReminderGroupBusinessService } from './ReminderGroupBusinessService';
import { GroupStats } from '../value-objects';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import type { IUserReminderPreferenceRepository } from '../repositories/IUserReminderPreferenceRepository';

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
  private readonly groupBusinessService: ReminderGroupBusinessService;

  constructor(
    private readonly reminderTemplateRepository: IReminderTemplateRepository,
    private readonly reminderGroupRepository: IReminderGroupRepository,
    private readonly userReminderPreferenceRepository?: IUserReminderPreferenceRepository,
  ) {
    this.controlService = new ReminderTemplateControlService(
      reminderTemplateRepository,
      reminderGroupRepository,
      userReminderPreferenceRepository,
    );
    this.groupBusinessService = new ReminderGroupBusinessService();
  }

  private async getGlobalReminderEnabled(identityId: string): Promise<boolean> {
    if (!this.userReminderPreferenceRepository) {
      return true;
    }

    const preferences = await this.userReminderPreferenceRepository.findByIdentityId(identityId);
    return preferences?.globalReminderEnabled ?? true;
  }

  public async syncTemplateEffectiveEnabled(template: ReminderTemplate): Promise<void> {
    const effectiveStatus = await this.controlService.calculateEffectiveStatus(template);
    template.setEffectiveEnabled(effectiveStatus.isEffectivelyEnabled);
  }

  public async syncTemplatesEffectiveEnabledByIdentity(identityId: string): Promise<void> {
    const templates = await this.reminderTemplateRepository.findByIdentityId(identityId);
    for (const template of templates) {
      await this.syncTemplateEffectiveEnabled(template);
      await this.reminderTemplateRepository.save(template);
    }
  }

  public async syncTemplatesEffectiveEnabledByGroup(groupId: string): Promise<void> {
    const templates = await this.reminderTemplateRepository.findByGroupId(groupId);
    for (const template of templates) {
      await this.syncTemplateEffectiveEnabled(template);
      await this.reminderTemplateRepository.save(template);
    }
  }

  /**
   * 获取模板控制服务（供应用层使用）
   */
  public getControlService(): ReminderTemplateControlService {
    return this.controlService;
  }

  // --- ReminderTemplate Methods ---

  public async createReminderTemplate(params: {
    identityId: string;
    title: string;
    type: ReminderType;
    trigger: TriggerConfigDTO;
    activeTime: ActiveTimeConfigDTO;
    notificationConfig: NotificationConfigDTO;
    description?: string;
    activeHours?: ActiveHoursConfigDTO;
    importanceLevel?: ImportanceLevel;
    tags?: string[];
    color?: string;
    icon?: string;
    groupId?: string;
  }): Promise<ReminderTemplate> {
    if (params.groupId) {
      const group = await this.reminderGroupRepository.findById(params.groupId);
      if (!group || group.identityId !== params.identityId) {
        throw new Error(`Invalid groupId: ${params.groupId}`);
      }
    }

    const template = ReminderTemplate.create({
      ...params,
      identityId: params.identityId as IdentityId,
    });
    await this.syncTemplateEffectiveEnabled(template);
    await this.reminderTemplateRepository.save(template);

    // TODO: Update group stats if groupId is present
    if (params.groupId) {
      await this.updateGroupStats(params.groupId);
    }

    return template;
  }

  public async getTemplate(
    id: string,
    options?: { includeHistory?: boolean },
  ): Promise<ReminderTemplate | null> {
    return this.reminderTemplateRepository.findById(id, options);
  }

  public async deleteTemplate(id: string, softDelete: boolean = true): Promise<void> {
    const template = await this.getTemplate(id);
    if (!template) {
      throw new Error(`ReminderTemplate not found: ${id}`);
    }

    const groupId = template.groupId;

    if (softDelete) {
      template.softDelete();
      await this.reminderTemplateRepository.save(template);
    } else {
      await this.reminderTemplateRepository.delete(id);
    }

    if (groupId) {
      await this.updateGroupStats(groupId);
    }
  }

  // --- ReminderGroup Methods ---

  public async createReminderGroup(params: {
    identityId: string;
    name: string;
    controlMode?: ControlMode;
    description?: string;
    color?: string;
    icon?: string;
    order?: number;
  }): Promise<ReminderGroup> {
    const existingGroup = await this.reminderGroupRepository.findByName(
      params.identityId,
      params.name,
    );
    if (existingGroup) {
      throw new Error(`ReminderGroup with name "${params.name}" already exists.`);
    }

    const group = ReminderGroup.create({ ...params, identityId: params.identityId });
    await this.reminderGroupRepository.save(group);
    return group;
  }

  public async getGroup(id: string): Promise<ReminderGroup | null> {
    return this.reminderGroupRepository.findById(id);
  }

  public async deleteGroup(id: string, softDelete: boolean = true): Promise<void> {
    // Business Rule: Cannot delete a group that still contains templates.
    const templatesInGroup = await this.reminderTemplateRepository.findByGroupId(id);
    if (templatesInGroup.length > 0) {
      throw new Error(
        `Cannot delete group ${id} because it still contains ${templatesInGroup.length} templates.`,
      );
    }

    if (softDelete) {
      const group = await this.getGroup(id);
      if (group) {
        group.softDelete();
        await this.reminderGroupRepository.save(group);
      }
    } else {
      await this.reminderGroupRepository.delete(id);
    }
  }

  // --- Cross-Aggregate Methods ---

  public async assignTemplateToGroup(
    templateId: string,
    groupId: string | null,
  ): Promise<ReminderTemplate> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`ReminderTemplate not found: ${templateId}`);
    }

    const oldGroupId = template.groupId;

    if (groupId) {
      const group = await this.getGroup(groupId);
      if (!group || group.identityId !== template.identityId) {
        throw new Error(`Invalid groupId: ${groupId}`);
      }
    }

    // This logic should be on the aggregate
    template.moveToGroup(groupId);
    await this.syncTemplateEffectiveEnabled(template);

    await this.reminderTemplateRepository.save(template);

    // Update stats for both old and new groups
    if (oldGroupId) {
      await this.updateGroupStats(oldGroupId);
    }
    if (groupId) {
      await this.updateGroupStats(groupId);
    }

    return template;
  }

  public async toggleGroupAndTemplates(id: string): Promise<ReminderGroup> {
    const group = await this.getGroup(id);
    if (!group) {
      throw new Error(`ReminderGroup not found: ${id}`);
    }

    group.toggle();
    await this.reminderGroupRepository.save(group);

    await this.syncTemplatesEffectiveEnabledByGroup(id);

    return group;
  }

  public async updateGroupStats(groupId: string): Promise<void> {
    const group = await this.getGroup(groupId);
    if (!group) return;
    const templates = await this.reminderTemplateRepository.findByGroupId(groupId, {
      includeDeleted: false,
    });

    const stats = this.groupBusinessService.calculateGroupStatistics(templates);
    group.updateStats(
      GroupStats.create({
        totalTemplates: stats.totalTemplates,
        activeTemplates: stats.activeTemplates,
        pausedTemplates: stats.pausedTemplates,
        selfEnabledTemplates: templates.filter((template) => template.selfEnabled).length,
        selfPausedTemplates: templates.filter((template) => !template.selfEnabled).length,
      }),
    );
    await this.reminderGroupRepository.save(group);
  }
}
