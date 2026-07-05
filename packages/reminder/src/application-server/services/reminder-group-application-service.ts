import type { Result } from '@dailyuse/contracts/result';
import { fail, ok } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type {
  BatchGroupTemplatesReq,
  BatchGroupTemplatesRes,
  CreateReminderGroupReq,
  CreateReminderGroupRes,
  GroupStatsDTO,
  ReminderGroupListRes,
  SwitchGroupControlModeReq,
  UpdateReminderGroupReq,
} from '@dailyuse/contracts/reminder';
import { ReminderGroup } from '../../domain-server/aggregates/reminder-group';
import { ReminderDomainService } from '../../domain-server/services/reminder-domain-service';
import type { IReminderGroupRepository } from '../../domain-server/repositories/i-reminder-group-repository';
import type { IReminderTemplateRepository } from '../../domain-server/repositories/i-reminder-template-repository';
import { GroupStats } from '../../domain-shared/value-objects/group-stats';

export interface ReminderGroupApplicationServiceDependencies {
  readonly reminderGroupRepository: IReminderGroupRepository;
  readonly reminderTemplateRepository: IReminderTemplateRepository;
  readonly reminderDomainService: ReminderDomainService;
}

export class ReminderGroupApplicationService {
  private readonly reminderGroupRepository: IReminderGroupRepository;
  private readonly reminderTemplateRepository: IReminderTemplateRepository;
  private readonly reminderDomainService: ReminderDomainService;

  constructor(dependencies: ReminderGroupApplicationServiceDependencies) {
    this.reminderGroupRepository = dependencies.reminderGroupRepository;
    this.reminderTemplateRepository = dependencies.reminderTemplateRepository;
    this.reminderDomainService = dependencies.reminderDomainService;
  }

  private async getOwnedGroupOrFail(
    groupId: string,
    ctx: ExecutionContext,
  ): Promise<ReminderGroup | null> {
    const group = await this.reminderGroupRepository.findById(groupId);
    if (!group || String(group.identityId) !== ctx.identityId) {
      return null;
    }

    return group;
  }

  async createGroup(
    data: CreateReminderGroupReq,
    ctx: ExecutionContext,
  ): Promise<Result<CreateReminderGroupRes>> {
    const group = await this.reminderDomainService.createReminderGroup({
      ...data,
      identityId: ctx.identityId,
    });
    return ok(group.toClientDTO());
  }

  async listGroups(ctx: ExecutionContext): Promise<Result<ReminderGroupListRes>> {
    const groups = await this.reminderGroupRepository.findByIdentityId(ctx.identityId);
    const data = groups.map((group) => group.toClientDTO());

    return ok({
      groups: data,
      total: data.length,
      page: 1,
      pageSize: data.length,
      hasMore: false,
    });
  }

  async getGroup(id: string, ctx: ExecutionContext): Promise<Result<CreateReminderGroupRes>> {
    const group = await this.getOwnedGroupOrFail(id, ctx);
    if (!group) {
      return fail({ code: 'NOT_FOUND', message: 'Group not found' });
    }

    return ok(group.toClientDTO());
  }

  async updateGroup(
    id: string,
    data: UpdateReminderGroupReq,
    ctx: ExecutionContext,
  ): Promise<Result<CreateReminderGroupRes>> {
    const existing = await this.getOwnedGroupOrFail(id, ctx);
    if (!existing) {
      return fail({ code: 'NOT_FOUND', message: 'Group not found' });
    }

    const updated = ReminderGroup.load({
      id: existing.id,
      identityId: existing.identityId,
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      controlMode: data.controlMode ?? existing.controlMode,
      enabled: existing.enabled,
      status: existing.status,
      order: data.order ?? existing.order,
      color: data.color ?? existing.color,
      icon: data.icon ?? existing.icon,
      stats: GroupStats.fromDTO(existing.stats as GroupStatsDTO),
      createdAt: existing.createdAt,
      updatedAt: new Date(),
      deletedAt: existing.deletedAt,
      version: existing.version,
    });

    await this.reminderGroupRepository.save(updated);
    await this.reminderDomainService.syncTemplatesEffectiveEnabledByGroup(id);

    return ok(updated.toClientDTO());
  }

  async deleteGroup(id: string, ctx: ExecutionContext): Promise<Result<undefined>> {
    const existing = await this.getOwnedGroupOrFail(id, ctx);
    if (!existing) {
      return fail({ code: 'NOT_FOUND', message: 'Group not found' });
    }

    await this.reminderDomainService.deleteGroup(id, false);
    return ok(undefined);
  }

  async switchGroupControlMode(
    id: string,
    data: SwitchGroupControlModeReq,
    ctx: ExecutionContext,
  ): Promise<Result<CreateReminderGroupRes>> {
    const existing = await this.getOwnedGroupOrFail(id, ctx);
    if (!existing) {
      return fail({ code: 'NOT_FOUND', message: 'Group not found' });
    }

    if (data.mode === 'Group') {
      existing.switchToGroupControl();
    } else {
      existing.switchToIndividualControl();
    }

    await this.reminderGroupRepository.save(existing);
    await this.reminderDomainService.syncTemplatesEffectiveEnabledByGroup(id);

    return ok(existing.toClientDTO());
  }

  async batchGroupTemplates(
    groupId: string,
    data: BatchGroupTemplatesReq,
    ctx: ExecutionContext,
  ): Promise<Result<BatchGroupTemplatesRes>> {
    const group = await this.getOwnedGroupOrFail(groupId, ctx);
    if (!group) {
      return fail({ code: 'NOT_FOUND', message: 'Group not found' });
    }

    const templates = await this.reminderTemplateRepository.findByGroupId(group.id);
    let successCount = 0;

    for (const template of templates) {
      if (String(template.identityId) !== ctx.identityId) {
        continue;
      }

      if (data.action === 'ENABLE') {
        template.enable();
      } else {
        template.pause();
      }

      await this.reminderDomainService.syncTemplateEffectiveEnabled(template);
      await this.reminderTemplateRepository.save(template);
      successCount++;
    }

    await this.reminderDomainService.updateGroupStats(group.id);

    return ok({ successCount, failedCount: 0 });
  }

  async toggleGroup(id: string, ctx: ExecutionContext): Promise<Result<CreateReminderGroupRes>> {
    const group = await this.getOwnedGroupOrFail(id, ctx);
    if (!group) {
      return fail({ code: 'NOT_FOUND', message: 'Group not found' });
    }

    const toggled = await this.reminderDomainService.toggleGroupAndTemplates(group.id);
    return ok(toggled.toClientDTO());
  }
}
