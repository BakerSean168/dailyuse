/**
 * SettingHistory 实体实现
 * 设置变更历史记录
 */

import { Entity } from '@dailyuse/utils';
import type { SettingHistoryId, SettingEntryId, TransferDate, PersistenceDate, DomainDate } from '@dailyuse/contracts/primitives';
import { SettingHistoryId as SettingHistoryIdType, SettingEntryId as SettingEntryIdType } from '@/domain-shared';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// ============ Local Type Definitions ============
// TODO: Move these to @dailyuse/contracts/setting when finalizing API

/** 操作者类型 */
export type OperatorType = 'USER' | 'SYSTEM' | 'API';

/** SettingHistory Server 接口 */
export interface SettingHistoryServer {
  readonly id: SettingHistoryId;
  readonly settingEntryId: SettingEntryId;
  readonly settingKey: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
  readonly operatorId: string | null;
  readonly operatorType: OperatorType;
  readonly createdAt: DomainDate;
  
  toServerDTO(): SettingHistoryServerDTO;
  toClientDTO(): SettingHistoryClientDTO;
  toPersistenceDTO(): SettingHistoryPersistenceDTO;
}

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

/** Persistence DTO - 用于数据库存储 */
export interface SettingHistoryPersistenceDTO {
  id: SettingHistoryId;
  settingEntryId: SettingEntryId;
  settingKey: string;
  oldValue: string; // JSON serialized
  newValue: string; // JSON serialized
  operatorId: string | null;
  operatorType: OperatorType;
  createdAt: PersistenceDate;
}

/**
 * SettingHistory 实体
 * 设置变更历史记录
 */
export class SettingHistory extends Entity<SettingHistoryId> implements SettingHistoryServer {
  public readonly settingEntryId: SettingEntryId;
  public readonly settingKey: string;
  public readonly oldValue: unknown;
  public readonly newValue: unknown;
  public readonly operatorId: string | null;
  public readonly operatorType: OperatorType;
  public readonly createdAt: DomainDate;

  private constructor(
    id: SettingHistoryId,
    params: {
      settingEntryId: SettingEntryId;
      settingKey: string;
      oldValue: unknown;
      newValue: unknown;
      operatorId: string | null;
      operatorType: OperatorType;
      createdAt: Date;
    }
  ) {
    super(id);
    this.settingEntryId = params.settingEntryId;
    this.settingKey = params.settingKey;
    this.oldValue = params.oldValue;
    this.newValue = params.newValue;
    this.operatorId = params.operatorId;
    this.operatorType = params.operatorType;
    this.createdAt = params.createdAt;
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

    return new SettingHistory(id, {
      settingEntryId: params.settingEntryId,
      settingKey: params.settingKey,
      oldValue: params.oldValue,
      newValue: params.newValue,
      operatorId: params.operatorId ?? null,
      operatorType: params.operatorType,
      createdAt: new Date(),
    });
  }

  /**
   * 从 ServerDTO 重建
   */
  public static fromServerDTO(dto: SettingHistoryServerDTO): SettingHistory {
    const id = SettingHistoryIdType.of(dto.id);
    return new SettingHistory(id, {
      settingEntryId: dto.settingEntryId,
      settingKey: dto.settingKey,
      oldValue: dto.oldValue,
      newValue: dto.newValue,
      operatorId: dto.operatorId,
      operatorType: dto.operatorType,
      createdAt: new Date(dto.createdAt),
    });
  }

  /**
   * 从 PersistenceDTO 重建
   */
  public static fromPersistenceDTO(dto: SettingHistoryPersistenceDTO): SettingHistory {
    const id = SettingHistoryIdType.of(dto.id);
    return new SettingHistory(id, {
      settingEntryId: dto.settingEntryId,
      settingKey: dto.settingKey,
      oldValue: JSON.parse(dto.oldValue),
      newValue: JSON.parse(dto.newValue),
      operatorId: dto.operatorId,
      operatorType: dto.operatorType,
      createdAt: dto.createdAt,
    });
  }

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

  /**
   * 转换为 PersistenceDTO
   */
  public toPersistenceDTO(): SettingHistoryPersistenceDTO {
    return {
      id: this.id,
      settingEntryId: this.settingEntryId,
      settingKey: this.settingKey,
      oldValue: JSON.stringify(this.oldValue),
      newValue: JSON.stringify(this.newValue),
      operatorId: this.operatorId,
      operatorType: this.operatorType,
      createdAt: this.createdAt,
    };
  }
}
