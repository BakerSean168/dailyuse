/**
 * SettingHistory 实体实现
 * 设置变更历史记录
 */

import { Entity } from '@dailyuse/utils';
import type { SettingHistoryId, SettingEntryId, TransferDate, DomainDate } from '@dailyuse/contracts/primitives';
import { SettingHistoryId as SettingHistoryIdType } from '@/domain-shared/value-objects/setting-history-id';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// ============ Local Type Definitions ============
// TODO: Move these to @dailyuse/contracts/setting when finalizing API

/** 操作者类型 */
export type OperatorType = 'USER' | 'SYSTEM' | 'API';

/** Server DTO - 用于 Server 和 Client 传输 */
export interface SettingHistoryServerDTO {
  id: SettingHistoryId;
  settingEntryId: SettingEntryId;
  settingKey: string;
  oldValue: unknown;
  newValue: unknown;
  operatorId: string | null;
  operatorType: OperatorType;
  createdAt: TransferDate;
}

/** Client DTO - 用于展示层 */
export interface SettingHistoryClientDTO extends SettingHistoryServerDTO {
  timeAgo: string;
  changeText: string;
}

/** Domain state for SettingHistory */
export interface SettingHistoryState {
  id: SettingHistoryId;
  settingEntryId: SettingEntryId;
  settingKey: string;
  oldValue: unknown;
  newValue: unknown;
  operatorId: string | null;
  operatorType: OperatorType;
  createdAt: Date;
}

/**
 * SettingHistory 实体
 * 设置变更历史记录
 */
export class SettingHistory extends Entity<SettingHistoryId> {
  public readonly settingEntryId: SettingEntryId;
  public readonly settingKey: string;
  public readonly oldValue: unknown;
  public readonly newValue: unknown;
  public readonly operatorId: string | null;
  public readonly operatorType: OperatorType;
  public readonly createdAt: DomainDate;

  private constructor(state: SettingHistoryState) {
    super(state.id);
    this.settingEntryId = state.settingEntryId;
    this.settingKey = state.settingKey;
    this.oldValue = state.oldValue;
    this.newValue = state.newValue;
    this.operatorId = state.operatorId;
    this.operatorType = state.operatorType;
    this.createdAt = state.createdAt;
  }

  // ============ Helper Methods for Client DTO ============

  private getTimeAgo(): string {
    return formatDistanceToNow(this.createdAt, {
      addSuffix: true,
      locale: zhCN,
    });
  }

  private getChangeText(): string {
    const formatValue = (value: unknown): string => {
      if (value === null || value === undefined) return '空';
      if (typeof value === 'boolean') return value ? '是' : '否';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    };

    const oldStr = formatValue(this.oldValue);
    const newStr = formatValue(this.newValue);

    return `从 "${oldStr}" 变更为 "${newStr}"`;
  }

  // ============ Factory Methods ============

  /**
   * Reconstruct from persisted state
   */
  public static load(state: SettingHistoryState): SettingHistory {
    return new SettingHistory(state);
  }

  /**
   * 创建新的 SettingHistory
   */
  public static create(params: {
    settingEntryId: SettingEntryId;
    settingKey: string;
    oldValue: unknown;
    newValue: unknown;
    operatorId?: string;
    operatorType: OperatorType;
  }): SettingHistory {
    if (!params.settingEntryId) {
      throw new Error('SettingEntryId is required');
    }
    if (!params.settingKey) {
      throw new Error('SettingKey is required');
    }

    const id = SettingHistoryIdType.of(SettingHistoryIdType.generate());

    return new SettingHistory({
      id,
      settingEntryId: params.settingEntryId,
      settingKey: params.settingKey,
      oldValue: params.oldValue,
      newValue: params.newValue,
      operatorId: params.operatorId ?? null,
      operatorType: params.operatorType,
      createdAt: new Date(),
    });
  }

  // ============ DTO Conversion ============

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): SettingHistoryServerDTO {
    return {
      id: this.id,
      settingEntryId: this.settingEntryId,
      settingKey: this.settingKey,
      oldValue: this.oldValue,
      newValue: this.newValue,
      operatorId: this.operatorId,
      operatorType: this.operatorType,
      createdAt: this.createdAt.getTime(),
    };
  }

  public toClientDTO(): SettingHistoryClientDTO {
    return {
      ...this.toServerDTO(),
      // Computed properties
      timeAgo: this.getTimeAgo(),
      changeText: this.getChangeText(),
    };
  }
}
