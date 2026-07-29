/**
 * ReminderTemplateBusinessService - 提醒模板业务服务
 *
 * DDD Domain Service - 纯函数实现
 *
 * 核心原则：
 * - 无副作用：不修改输入对象，不访问数据库
 * - 纯计算：输入对象 → 计算 → 输出结果
 * - 职责单一：只处理模板相关的业务规则
 *
 * 注意：
 * - 所有数据查询由 Application Service 负责
 * - 所有持久化操作由 Application Service 负责
 * - 此服务只负责业务逻辑的计算和验证
 */

import type { ReminderTemplate } from '../aggregates/reminder-template';
import type { ReminderGroup } from '../aggregates/reminder-group';
import { ControlMode, ReminderStatus } from '@memoflow/contracts/reminder';

/**
 * 模板有效状态计算结果
 */
export interface TemplateEffectiveStatus {
  /** 是否有效启用 */
  isEffectivelyEnabled: boolean;
  /** 计算原因说明 */
  reason: string;
  /** 原始模板状态 */
  templateStatus: ReminderStatus;
  /** 分组状态（如果有） */
  groupStatus: ReminderStatus | null;
  /** 控制模式（如果有） */
  controlMode: ControlMode | null;
}

/**
 * 分组分配验证结果
 */
export interface GroupAssignmentValidation {
  /** 是否有效 */
  valid: boolean;
  /** 错误原因（如果无效） */
  reason?: string;
}

/**
 * ReminderTemplateBusinessService
 *
 * 提醒模板相关的纯业务逻辑服务
 */
export class ReminderTemplateBusinessService {
  /**
   * 计算模板的实际启用状态
   *
   * 业务规则：
   * 1. 模板未分组：effectiveEnabled = template.selfEnabled
   * 2. 分组为 INDIVIDUAL 模式：effectiveEnabled = template.selfEnabled
   * 3. 分组为 GROUP 模式：effectiveEnabled = group.enabled AND template.selfEnabled
   *
   * @param template - 提醒模板对象
   * @param group - 所属分组对象（可为 null）
   * @returns 计算结果
   */
  public calculateEffectiveEnabled(
    template: ReminderTemplate,
    group: ReminderGroup | null,
    globalReminderEnabled: boolean = true,
  ): TemplateEffectiveStatus {
    const templateStatus = template.status;
    const templateEnabled = templateStatus === ReminderStatus.Active;

    if (!globalReminderEnabled) {
      return {
        isEffectivelyEnabled: false,
        reason: '全局提醒总开关已关闭',
        templateStatus,
        groupStatus: group?.status ?? null,
        controlMode: group?.controlMode ?? null,
      };
    }

    // 规则 1: 未分组，使用模板自身状态
    if (!group) {
      return {
        isEffectivelyEnabled: templateEnabled,
        reason: '未分组，使用模板自身状态',
        templateStatus,
        groupStatus: null,
        controlMode: null,
      };
    }

    const groupStatus = group.status;
    const groupEnabled = groupStatus === ReminderStatus.Active;
    const controlMode = group.controlMode;

    // 规则 2: INDIVIDUAL 模式，使用模板自身状态
    if (controlMode === ControlMode.Individual) {
      return {
        isEffectivelyEnabled: templateEnabled,
        reason: '分组为独立控制模式，使用模板自身状态',
        templateStatus,
        groupStatus,
        controlMode,
      };
    }

    // 规则 3: GROUP 模式，仅受分组状态控制
    const isEffectivelyEnabled = groupEnabled;

    let reason = '分组为组控制模式';
    if (!groupEnabled) {
      reason += '，分组已暂停';
    } else if (!templateEnabled) {
      reason += '，模板自身状态已暂停，但当前由分组接管';
    } else {
      reason += '，分组已启用';
    }

    return {
      isEffectivelyEnabled,
      reason,
      templateStatus,
      groupStatus,
      controlMode,
    };
  }

  /**
   * 批量计算多个模板的实际启用状态
   *
   * @param templates - 模板列表
   * @param groupMap - 分组映射表（key: groupId, value: ReminderGroup）
   * @returns 计算结果列表
   */
  public calculateEffectiveEnabledBatch(
    templates: ReminderTemplate[],
    groupMap: Map<string, ReminderGroup>,
    globalReminderEnabled: boolean = true,
  ): Map<string, TemplateEffectiveStatus> {
    const resultMap = new Map<string, TemplateEffectiveStatus>();

    for (const template of templates) {
      const group = template.groupId ? groupMap.get(template.groupId) : null;
      const status = this.calculateEffectiveEnabled(template, group || null, globalReminderEnabled);
      resultMap.set(template.id, status);
    }

    return resultMap;
  }

  /**
   * 验证模板分组分配是否合法
   *
   * 业务规则：
   * 1. 如果目标分组为 null，始终合法（移出分组）
   * 2. 模板和分组必须属于同一账户
   *
   * @param template - 提醒模板对象
   * @param targetGroup - 目标分组对象（null 表示移出分组）
   * @returns 验证结果
   */
  public validateGroupAssignment(
    template: ReminderTemplate,
    targetGroup: ReminderGroup | null,
  ): GroupAssignmentValidation {
    // 移出分组，始终合法
    if (!targetGroup) {
      return { valid: true };
    }

    // 检查账户一致性
    if (targetGroup.identityId !== template.identityId) {
      return {
        valid: false,
        reason: `分组 ${targetGroup.id} 属于账户 ${targetGroup.identityId}，与模板账户 ${template.identityId} 不一致`,
      };
    }

    return { valid: true };
  }

  /**
   * 验证模板是否可以删除
   *
   * 业务规则：
   * 1. 已删除的模板不能再次删除
   * 2. 其他情况均可删除（软删除或硬删除）
   *
   * @param template - 提醒模板对象
   * @param hardDelete - 是否硬删除
   * @returns 验证结果
   */
  public validateTemplateDeletion(
    template: ReminderTemplate,
    hardDelete: boolean,
  ): GroupAssignmentValidation {
    if (!hardDelete && template.deletedAt) {
      return {
        valid: false,
        reason: '模板已被软删除，无法再次软删除',
      };
    }

    return { valid: true };
  }
}
