/**
 * ReminderGroupBusinessService - 提醒分组业务服务
 *
 * DDD Domain Service - 纯函数实现
 * 
 * 核心原则：
 * - 无副作用：不修改输入对象，不访问数据库
 * - 纯计算：输入对象 → 计算 → 输出结果
 * - 职责单一：只处理分组相关的业务规则
 */

import type { ReminderGroup } from '../aggregates/reminder-group';
import type { ReminderTemplate } from '../aggregates/reminder-template';
import { ControlMode, ReminderStatus } from '@dailyuse/contracts/reminder';

/**
 * 分组统计数据
 */
export interface GroupStatistics {
  /** 总模板数 */
  totalTemplates: number;
  /** 启用的模板数 */
  activeTemplates: number;
  /** 暂停的模板数 */
  pausedTemplates: number;
  /** 已删除的模板数 */
  deletedTemplates: number;
}

/**
 * 分组删除验证结果
 */
export interface GroupDeletionValidation {
  /** 是否可以删除 */
  valid: boolean;
  /** 错误原因（如果无效） */
  reason?: string;
  /** 影响的模板数量 */
  affectedTemplateCount?: number;
}

/**
 * 分组名称唯一性验证结果
 */
export interface GroupNameValidation {
  /** 是否唯一 */
  valid: boolean;
  /** 错误原因（如果重复） */
  reason?: string;
  /** 冲突的分组 */
  conflictingGroup?: ReminderGroup;
}

/**
 * ReminderGroupBusinessService
 * 
 * 提醒分组相关的纯业务逻辑服务
 */
export class ReminderGroupBusinessService {
  /**
   * 计算分组统计数据
   * 
   * @param templates - 分组下的模板列表
   * @param includeDeleted - 是否包含已删除的模板
   * @returns 统计数据
   */
  public calculateGroupStatistics(
    templates: ReminderTemplate[],
    includeDeleted: boolean = false,
  ): GroupStatistics {
    let totalTemplates = 0;
    let activeTemplates = 0;
    let pausedTemplates = 0;
    let deletedTemplates = 0;

    for (const template of templates) {
      if (template.deletedAt) {
        deletedTemplates++;
        if (!includeDeleted) continue;
      }

      totalTemplates++;

      if (template.status === ReminderStatus.Active) {
        activeTemplates++;
      } else {
        pausedTemplates++;
      }
    }

    return {
      totalTemplates,
      activeTemplates,
      pausedTemplates,
      deletedTemplates,
    };
  }

  /**
   * 验证分组是否可以删除
   * 
   * 业务规则：
   * 1. 分组下还有模板时不能删除（包括软删除的模板）
   * 2. 已删除的分组不能再次软删除
   * 
   * @param group - 分组对象
   * @param templates - 分组下的模板列表
   * @param hardDelete - 是否硬删除
   * @returns 验证结果
   */
  public validateGroupDeletion(
    group: ReminderGroup,
    templates: ReminderTemplate[],
    hardDelete: boolean,
  ): GroupDeletionValidation {
    const activeTemplates = templates.filter(t => !t.deletedAt);

    // 分组下还有活动模板
    if (activeTemplates.length > 0) {
      return {
        valid: false,
        reason: `分组下还有 ${activeTemplates.length} 个模板，无法删除`,
        affectedTemplateCount: activeTemplates.length,
      };
    }

    // 软删除时检查分组是否已删除
    if (!hardDelete && group.deletedAt) {
      return {
        valid: false,
        reason: '分组已被软删除，无法再次软删除',
        affectedTemplateCount: 0,
      };
    }

    return {
      valid: true,
      affectedTemplateCount: 0,
    };
  }

  /**
   * 验证分组名称是否唯一
   * 
   * @param accountUuid - 账户 UUID
   * @param name - 分组名称
   * @param existingGroups - 现有分组列表
   * @param excludeGroupUuid - 排除的分组 UUID（用于更新时检查）
   * @returns 验证结果
   */
  public validateGroupNameUniqueness(
    accountUuid: string,
    name: string,
    existingGroups: ReminderGroup[],
    excludeGroupUuid?: string,
  ): GroupNameValidation {
    const conflictingGroup = existingGroups.find(
      g =>
        g.identityId === accountUuid &&
        g.name === name &&
        g.id !== excludeGroupUuid &&
        !g.deletedAt, // 忽略已删除的分组
    );

    if (conflictingGroup) {
      return {
        valid: false,
        reason: `分组名称 "${name}" 已存在`,
        conflictingGroup,
      };
    }

    return { valid: true };
  }

  /**
   * 计算控制模式变更对模板的影响
   * 
   * 返回需要重新计算 effectiveEnabled 的模板列表
   * 
   * @param oldControlMode - 旧的控制模式
   * @param newControlMode - 新的控制模式
   * @param templates - 分组下的模板列表
   * @returns 受影响的模板列表
   */
  public calculateControlModeChangeImpact(
    oldControlMode: ControlMode,
    newControlMode: ControlMode,
    templates: ReminderTemplate[],
  ): ReminderTemplate[] {
    // 如果控制模式没变，无影响
    if (oldControlMode === newControlMode) {
      return [];
    }

    // 所有模板都受影响（需要重新计算 effectiveEnabled）
    return templates.filter(t => !t.deletedAt);
  }

  /**
   * 计算分组启用状态变更对模板的影响
   * 
   * 只有在 GROUP 控制模式下，分组启用状态变更才会影响模板
   * 
   * @param group - 分组对象
   * @param templates - 分组下的模板列表
   * @returns 受影响的模板列表
   */
  public calculateGroupStatusChangeImpact(
    group: ReminderGroup,
    templates: ReminderTemplate[],
  ): ReminderTemplate[] {
    // 只有 Group 模式下才有影响
    if (group.controlMode !== ControlMode.Group) {
      return [];
    }

    // 返回所有未删除的模板
    return templates.filter(t => !t.deletedAt);
  }
}
