/**
 * ReminderTemplateControlService - 提醒模板控制服务
 *
 * DDD Domain Service:
 * - 处理提醒模板的有效启用状态计算
 * - 考虑分组控制模式的影响
 * - 跨聚合根的业务逻辑（ReminderTemplate + ReminderGroup）
 *
 * 职责：
 * - 计算模板是否真正处于启用状态（考虑分组控制）
 * - 批量计算模板的有效状态
 * - 提供状态查询接口
 */

import type { ReminderTemplate } from '../aggregates/reminder-template';
import type { ReminderGroup } from '../aggregates/reminder-group';
import type { IReminderTemplateRepository } from '../repositories/i-reminder-template-repository';
import type { IReminderGroupRepository } from '../repositories/i-reminder-group-repository';
import type { IUserReminderPreferenceRepository } from '../repositories/i-user-reminder-preference-repository';
import { ControlMode, ReminderStatus } from '@dailyuse/contracts/reminder';

// 枚举值使用（避免与类型别名冲突）

/**
 * 模板有效状态结果
 */
export interface ITemplateEffectiveStatus {
  /** 模板 UUID */
  templateId: string;
  /** 模板自身状态 */
  templateStatus: ReminderStatus;
  /** 所属分组 ID */
  groupId: string | null;
  /** 分组状态 */
  groupStatus: ReminderStatus | null;
  /** 分组控制模式 */
  controlMode: ControlMode | null;
  /** 最终有效状态（考虑分组控制后） */
  effectiveStatus: ReminderStatus;
  /** 是否真正启用 */
  isEffectivelyEnabled: boolean;
  /** 状态说明 */
  statusReason: string;
  /** 控制来源 */
  lifecycleSource: 'global' | 'group' | 'template';
  /** 全局提醒总开关 */
  globalReminderEnabled: boolean;
  /** 分组是否启用 */
  groupEnabled: boolean | null;
}

/**
 * ReminderTemplateControlService
 */
export class ReminderTemplateControlService {
  constructor(
    private readonly templateRepository: IReminderTemplateRepository,
    private readonly groupRepository: IReminderGroupRepository,
    private readonly preferenceRepository?: IUserReminderPreferenceRepository,
  ) {}

  private async getGlobalReminderEnabled(identityId: string): Promise<boolean> {
    if (!this.preferenceRepository) {
      return true;
    }

    const preferences = await this.preferenceRepository.findByIdentityId(identityId);
    return preferences?.globalReminderEnabled ?? true;
  }

  /**
   * 计算单个模板的有效启用状态
   *
   * 注意：计算服务接收 template 和 group 对象，不直接查询仓储
   * 应用层负责先获取这些对象，然后传递给计算服务
   *
   * 规则：
   * - 如果模板未分组：模板状态 = 有效状态
   * - 如果分组为 INDIVIDUAL 模式：模板状态 = 有效状态
   * - 如果分组为 GROUP 模式：分组状态 AND 模板状态 = 有效状态
   */
  async calculateEffectiveStatus(
    template: ReminderTemplate,
    group?: ReminderGroup | null,
  ): Promise<ITemplateEffectiveStatus> {
    const groupId = template.groupId;
    const templateStatus = template.status;
    const globalReminderEnabled = await this.getGlobalReminderEnabled(String(template.identityId));

    if (!globalReminderEnabled) {
      return {
        templateId: template.id,
        templateStatus,
        groupId: groupId ?? null,
        groupStatus: group?.status ?? null,
        controlMode: group?.controlMode ?? null,
        effectiveStatus: ReminderStatus.Paused,
        isEffectivelyEnabled: false,
        statusReason: '全局提醒总开关已关闭',
        lifecycleSource: 'global',
        globalReminderEnabled: false,
        groupEnabled: group?.enabled ?? null,
      };
    }

    // 未分组：模板状态即有效状态
    if (!groupId) {
      return {
        templateId: template.id,
        templateStatus,
        groupId: null,
        groupStatus: null,
        controlMode: null,
        effectiveStatus: templateStatus,
        isEffectivelyEnabled: templateStatus === ReminderStatus.Active,
        statusReason: '未分组，使用模板自身状态',
        lifecycleSource: 'template',
        globalReminderEnabled: true,
        groupEnabled: null,
      };
    }

    // 获取分组信息
    let targetGroup = group;
    if (!targetGroup) {
      targetGroup = await this.groupRepository.findById(groupId);
    }

    if (!targetGroup) {
      // 分组不存在，视为未分组
      return {
        templateId: template.id,
        templateStatus,
        groupId,
        groupStatus: null,
        controlMode: null,
        effectiveStatus: templateStatus,
        isEffectivelyEnabled: templateStatus === ReminderStatus.Active,
        statusReason: '分组不存在，使用模板自身状态',
        lifecycleSource: 'template',
        globalReminderEnabled: true,
        groupEnabled: null,
      };
    }

    const groupStatus = targetGroup.status;
    const controlMode = targetGroup.controlMode;

    // INDIVIDUAL 模式：模板状态即有效状态
    if (controlMode === ControlMode.Individual) {
      return {
        templateId: template.id,
        templateStatus,
        groupId,
        groupStatus,
        controlMode,
        effectiveStatus: templateStatus,
        isEffectivelyEnabled: templateStatus === ReminderStatus.Active,
        statusReason: '分组为独立控制模式，使用模板自身状态',
        lifecycleSource: 'template',
        globalReminderEnabled: true,
        groupEnabled: targetGroup.enabled,
      };
    }

    // GROUP 模式：仅受分组状态控制
    const effectiveStatus =
      groupStatus === ReminderStatus.Active ? ReminderStatus.Active : ReminderStatus.Paused;

    let statusReason = '分组为组控制模式';
    if (groupStatus === ReminderStatus.Paused) {
      statusReason += '，分组已暂停';
    } else if (templateStatus === ReminderStatus.Paused) {
      statusReason += '，模板自身已暂停，但当前由分组接管';
    } else {
      statusReason += '，分组已启用';
    }

    return {
      templateId: template.id,
      templateStatus,
      groupId,
      groupStatus,
      controlMode,
      effectiveStatus,
      isEffectivelyEnabled: effectiveStatus === ReminderStatus.Active,
      statusReason,
      lifecycleSource: 'group',
      globalReminderEnabled: true,
      groupEnabled: targetGroup.enabled,
    };
  }

  /**
   * 批量计算多个模板的有效启用状态
   */
  async calculateEffectiveStatusBatch(
    templates: ReminderTemplate[],
  ): Promise<ITemplateEffectiveStatus[]> {
    const globalEnabledByIdentity = new Map<string, boolean>();

    // 收集所有相关的分组 ID
    const groupIds = new Set<string>();
    for (const template of templates) {
      const identityId = String(template.identityId);
      if (!globalEnabledByIdentity.has(identityId)) {
        globalEnabledByIdentity.set(identityId, await this.getGlobalReminderEnabled(identityId));
      }
      if (template.groupId) {
        groupIds.add(template.groupId);
      }
    }

    // 批量加载分组
    const groups = await this.groupRepository.findByIds(Array.from(groupIds));
    const groupMap = new Map<string, ReminderGroup>();
    for (const group of groups) {
      groupMap.set(group.id, group);
    }

    // 计算每个模板的有效状态
    const results: ITemplateEffectiveStatus[] = [];
    for (const template of templates) {
      const groupId = template.groupId;
      const templateStatus = template.status;
      const globalReminderEnabled =
        globalEnabledByIdentity.get(String(template.identityId)) ?? true;

      if (!globalReminderEnabled) {
        results.push({
          templateId: template.id,
          templateStatus,
          groupId: groupId ?? null,
          groupStatus: null,
          controlMode: null,
          effectiveStatus: ReminderStatus.Paused,
          isEffectivelyEnabled: false,
          statusReason: '全局提醒总开关已关闭',
          lifecycleSource: 'global',
          globalReminderEnabled: false,
          groupEnabled: null,
        });
        continue;
      }

      if (!groupId) {
        results.push({
          templateId: template.id,
          templateStatus,
          groupId: null,
          groupStatus: null,
          controlMode: null,
          effectiveStatus: templateStatus,
          isEffectivelyEnabled: templateStatus === ReminderStatus.Active,
          statusReason: '未分组，使用模板自身状态',
          lifecycleSource: 'template',
          globalReminderEnabled: true,
          groupEnabled: null,
        });
        continue;
      }

      const group = groupMap.get(groupId);
      if (!group) {
        results.push({
          templateId: template.id,
          templateStatus,
          groupId,
          groupStatus: null,
          controlMode: null,
          effectiveStatus: templateStatus,
          isEffectivelyEnabled: templateStatus === ReminderStatus.Active,
          statusReason: '分组不存在，使用模板自身状态',
          lifecycleSource: 'template',
          globalReminderEnabled: true,
          groupEnabled: null,
        });
        continue;
      }

      const groupStatus = group.status;
      const controlMode = group.controlMode;

      if (controlMode === ControlMode.Individual) {
        results.push({
          templateId: template.id,
          templateStatus,
          groupId,
          groupStatus,
          controlMode,
          effectiveStatus: templateStatus,
          isEffectivelyEnabled: templateStatus === ReminderStatus.Active,
          statusReason: '分组为独立控制模式，使用模板自身状态',
          lifecycleSource: 'template',
          globalReminderEnabled: true,
          groupEnabled: group.enabled,
        });
        continue;
      }

      const effectiveStatus =
        groupStatus === ReminderStatus.Active ? ReminderStatus.Active : ReminderStatus.Paused;

      let statusReason = '分组为组控制模式';
      if (groupStatus === ReminderStatus.Paused) {
        statusReason += '，分组已暂停';
      } else if (templateStatus === ReminderStatus.Paused) {
        statusReason += '，模板自身已暂停，但当前由分组接管';
      } else {
        statusReason += '，分组已启用';
      }

      results.push({
        templateId: template.id,
        templateStatus,
        groupId,
        groupStatus,
        controlMode,
        effectiveStatus,
        isEffectivelyEnabled: effectiveStatus === ReminderStatus.Active,
        statusReason,
        lifecycleSource: 'group',
        globalReminderEnabled: true,
        groupEnabled: group.enabled,
      });
    }

    return results;
  }

  /**
   * 检查模板是否真正启用
   * （快捷方法，不需要完整的状态信息）
   */
  async isTemplateEffectivelyEnabled(template: ReminderTemplate): Promise<boolean> {
    const status = await this.calculateEffectiveStatus(template);
    return status.isEffectivelyEnabled;
  }

  /**
   * 获取分组下所有真正启用的模板
   */
  async getEffectivelyEnabledTemplatesInGroup(groupId: string): Promise<ReminderTemplate[]> {
    const templates = await this.templateRepository.findByGroupId(groupId);
    const statusResults = await this.calculateEffectiveStatusBatch(templates);

    const enabledTemplateIdSet = new Set(
      statusResults.filter((r) => r.isEffectivelyEnabled).map((r) => r.templateId),
    );

    return templates.filter((t) => enabledTemplateIdSet.has(t.id));
  }

  /**
   * 获取账户下所有真正启用的模板
   */
  async getEffectivelyEnabledTemplatesByIdentityId(
    identityId: string,
  ): Promise<ReminderTemplate[]> {
    const templates = await this.templateRepository.findByIdentityId(identityId);
    const statusResults = await this.calculateEffectiveStatusBatch(templates);

    const enabledTemplateIdSet = new Set(
      statusResults.filter((r) => r.isEffectivelyEnabled).map((r) => r.templateId),
    );

    return templates.filter((t: ReminderTemplate) => enabledTemplateIdSet.has(t.id));
  }
}
