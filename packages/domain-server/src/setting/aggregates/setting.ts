/**
 * Setting 聚合根实现
 * 设置聚合根 - 服务端实现
 */

import { AggregateRoot } from '@dailyuse/utils';
import type { SettingId, SettingGroupId, SettingEntryId, TransferDate, PersistenceDate, DomainDate } from '@dailyuse/contracts/primitives';
import { SettingScope, SettingValueType, type ValidationRuleDTO, type UIConfigDTO, type SyncConfigDTO } from '@dailyuse/contracts/setting';
import { SettingId as SettingIdType, ValidationRule, UIConfig, SyncConfig } from '@dailyuse/domain-shared/setting';
import { SettingHistory, type OperatorType } from '../entities/setting-history';

// ============ Local Type Definitions ============
// TODO: Move these to @dailyuse/contracts/setting when finalizing API

/** Setting Server 接口 */
export interface SettingServer {
  readonly id: SettingId;
  readonly key: string;
  readonly name: string;
  readonly description: string | null;
  readonly valueType: SettingValueType;
  readonly value: unknown;
  readonly defaultValue: unknown;
  readonly scope: SettingScope;
  readonly accountId: string | null;
  readonly deviceId: string | null;
  readonly groupId: SettingGroupId | null;
  readonly validation: ValidationRule | null;
  readonly ui: UIConfig | null;
  readonly isEncrypted: boolean;
  readonly isReadOnly: boolean;
  readonly isSystemSetting: boolean;
  readonly syncConfig: SyncConfig | null;
  readonly createdAt: DomainDate;
  readonly updatedAt: DomainDate;
  readonly deletedAt: DomainDate | null;

  toServerDTO(): SettingServerDTO;
  toClientDTO(): SettingClientDTO;
  toPersistenceDTO(): SettingPersistenceDTO;
}

/** Server DTO - 用于 Server 和 Client 传输 */
export interface SettingServerDTO {
  id: SettingId;
  key: string;
  name: string;
  description: string | null;
  valueType: SettingValueType;
  value: unknown;
  defaultValue: unknown;
  scope: SettingScope;
  accountId: string | null;
  deviceId: string | null;
  groupId: string | null;
  validation: ValidationRuleDTO | null;
  ui: UIConfigDTO | null;
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystemSetting: boolean;
  syncConfig: SyncConfigDTO | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

/** Client DTO - 用于展示层 */
export interface SettingClientDTO extends SettingServerDTO {
  isDefault: boolean;
  displayValue: string;
  canEdit: boolean;
}

/** Persistence DTO - 用于数据库存储 */
export interface SettingPersistenceDTO {
  id: SettingId;
  key: string;
  name: string;
  description: string | null;
  valueType: SettingValueType;
  value: string; // JSON serialized
  defaultValue: string; // JSON serialized
  scope: SettingScope;
  accountId: string | null;
  deviceId: string | null;
  groupId: string | null;
  validation: string | null; // JSON serialized
  ui: string | null; // JSON serialized
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystemSetting: boolean;
  syncConfig: string | null; // JSON serialized
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}

/** Props interface for Setting */
interface SettingProps {
  key: string;
  name: string;
  description: string | null;
  valueType: SettingValueType;
  value: unknown;
  defaultValue: unknown;
  scope: SettingScope;
  accountId: string | null;
  deviceId: string | null;
  groupId: SettingGroupId | null;
  validation: ValidationRule | null;
  ui: UIConfig | null;
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystemSetting: boolean;
  syncConfig: SyncConfig | null;
  history: SettingHistory[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Setting 聚合根
 */
export class Setting extends AggregateRoot<SettingId> implements SettingServer {
  // ===== 私有属性容器 =====
  private _props: SettingProps;

  private constructor(
    id: SettingId,
    params: {
      key: string;
      name: string;
      description: string | null;
      valueType: SettingValueType;
      value: unknown;
      defaultValue: unknown;
      scope: SettingScope;
      accountId: string | null;
      deviceId: string | null;
      groupId: SettingGroupId | null;
      validation: ValidationRule | null;
      ui: UIConfig | null;
      isEncrypted: boolean;
      isReadOnly: boolean;
      isSystemSetting: boolean;
      syncConfig: SyncConfig | null;
      history: SettingHistory[];
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
    }
  ) {
    super(id);
    this._props = {
      key: params.key,
      name: params.name,
      description: params.description,
      valueType: params.valueType,
      value: params.value,
      defaultValue: params.defaultValue,
      scope: params.scope,
      accountId: params.accountId,
      deviceId: params.deviceId,
      groupId: params.groupId,
      validation: params.validation,
      ui: params.ui,
      isEncrypted: params.isEncrypted,
      isReadOnly: params.isReadOnly,
      isSystemSetting: params.isSystemSetting,
      syncConfig: params.syncConfig,
      history: params.history,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
      deletedAt: params.deletedAt,
    };
  }

  // ============ Getters ============

  public get key(): string { return this._props.key; }
  public get name(): string { return this._props.name; }
  public get description(): string | null { return this._props.description; }
  public get valueType(): SettingValueType { return this._props.valueType; }
  public get value(): unknown { return this._props.value; }
  public get defaultValue(): unknown { return this._props.defaultValue; }
  public get scope(): SettingScope { return this._props.scope; }
  public get accountId(): string | null { return this._props.accountId; }
  public get deviceId(): string | null { return this._props.deviceId; }
  public get groupId(): SettingGroupId | null { return this._props.groupId; }
  public get validation(): ValidationRule | null { return this._props.validation; }
  public get ui(): UIConfig | null { return this._props.ui; }
  public get isEncrypted(): boolean { return this._props.isEncrypted; }
  public get isReadOnly(): boolean { return this._props.isReadOnly; }
  public get isSystemSetting(): boolean { return this._props.isSystemSetting; }
  public get syncConfig(): SyncConfig | null { return this._props.syncConfig; }
  public get history(): SettingHistory[] { return [...this._props.history]; }
  public get createdAt(): DomainDate { return this._props.createdAt; }
  public get updatedAt(): DomainDate { return this._props.updatedAt; }
  public get deletedAt(): DomainDate | null { return this._props.deletedAt; }

  // ============ 业务方法 ============

  /**
   * 判断是否为默认值
   */
  public isDefault(): boolean {
    return JSON.stringify(this._props.value) === JSON.stringify(this._props.defaultValue);
  }

  /**
   * 获取显示值
   */
  private getDisplayValue(): string {
    if (this._props.value === null || this._props.value === undefined) {
      return '未设置';
    }
    switch (this._props.valueType) {
      case SettingValueType.Boolean:
        return this._props.value ? '是' : '否';
      case SettingValueType.Password:
        return '********';
      case SettingValueType.Object:
      case SettingValueType.Array:
        try {
          return JSON.stringify(this._props.value, null, 2);
        } catch {
          return '[无法显示的值]';
        }
      default:
        return String(this._props.value);
    }
  }

  /**
   * 判断是否可编辑
   */
  private getCanEdit(): boolean {
    return !this._props.isReadOnly;
  }

  /**
   * 设置值
   */
  public setValue(newValue: unknown, operatorId?: string, operatorType: OperatorType = 'USER'): void {
    if (this._props.isReadOnly) {
      throw new Error(`Setting ${this._props.key} is read-only`);
    }

    const oldValue = this._props.value;
    this._props.value = newValue;
    this._props.updatedAt = new Date();

    // 记录历史
    const historyEntry = SettingHistory.create({
      settingEntryId: this.id as unknown as SettingEntryId,
      settingKey: this._props.key,
      oldValue,
      newValue,
      operatorId,
      operatorType,
    });
    this._props.history.push(historyEntry);
  }

  /**
   * 重置为默认值
   */
  public resetToDefault(operatorId?: string): void {
    if (this._props.isReadOnly) {
      throw new Error(`Setting ${this._props.key} is read-only`);
    }

    this.setValue(this._props.defaultValue, operatorId, 'USER');
  }

  /**
   * 软删除
   */
  public delete(): void {
    this._props.deletedAt = new Date();
    this._props.updatedAt = new Date();
  }

  /**
   * 恢复
   */
  public restore(): void {
    this._props.deletedAt = null;
    this._props.updatedAt = new Date();
  }

  // ============ DTO 转换 ============

  public toServerDTO(): SettingServerDTO {
    return {
      id: this.id,
      key: this._props.key,
      name: this._props.name,
      description: this._props.description,
      valueType: this._props.valueType,
      value: this._props.value,
      defaultValue: this._props.defaultValue,
      scope: this._props.scope,
      accountId: this._props.accountId,
      deviceId: this._props.deviceId,
      groupId: this._props.groupId,
      validation: this._props.validation?.toDTO() ?? null,
      ui: this._props.ui?.toDTO() ?? null,
      isEncrypted: this._props.isEncrypted,
      isReadOnly: this._props.isReadOnly,
      isSystemSetting: this._props.isSystemSetting,
      syncConfig: this._props.syncConfig?.toDTO() ?? null,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }

  public toClientDTO(): SettingClientDTO {
    return {
      ...this.toServerDTO(),
      isDefault: this.isDefault(),
      displayValue: this.getDisplayValue(),
      canEdit: this.getCanEdit(),
    };
  }

  public toPersistenceDTO(): SettingPersistenceDTO {
    return {
      id: this.id,
      key: this._props.key,
      name: this._props.name,
      description: this._props.description,
      valueType: this._props.valueType,
      value: JSON.stringify(this._props.value),
      defaultValue: JSON.stringify(this._props.defaultValue),
      scope: this._props.scope,
      accountId: this._props.accountId,
      deviceId: this._props.deviceId,
      groupId: this._props.groupId,
      validation: this._props.validation ? JSON.stringify(this._props.validation.toDTO()) : null,
      ui: this._props.ui ? JSON.stringify(this._props.ui.toDTO()) : null,
      isEncrypted: this._props.isEncrypted,
      isReadOnly: this._props.isReadOnly,
      isSystemSetting: this._props.isSystemSetting,
      syncConfig: this._props.syncConfig ? JSON.stringify(this._props.syncConfig.toDTO()) : null,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      deletedAt: this._props.deletedAt,
    };
  }

  // ============ 工厂方法 ============

  public static create(params: {
    key: string;
    name: string;
    description?: string;
    valueType: SettingValueType;
    value: unknown;
    defaultValue: unknown;
    scope: SettingScope;
    accountId?: string;
    deviceId?: string;
    groupId?: SettingGroupId;
    validation?: ValidationRule;
    ui?: UIConfig;
    isEncrypted?: boolean;
    isReadOnly?: boolean;
    isSystemSetting?: boolean;
    syncConfig?: SyncConfig;
  }): Setting {
    const id = SettingIdType.of(SettingIdType.generate());
    const now = new Date();
    return new Setting(id, {
      key: params.key,
      name: params.name,
      description: params.description ?? null,
      valueType: params.valueType,
      value: params.value,
      defaultValue: params.defaultValue,
      scope: params.scope,
      accountId: params.accountId ?? null,
      deviceId: params.deviceId ?? null,
      groupId: params.groupId ?? null,
      validation: params.validation ?? null,
      ui: params.ui ?? null,
      isEncrypted: params.isEncrypted ?? false,
      isReadOnly: params.isReadOnly ?? false,
      isSystemSetting: params.isSystemSetting ?? false,
      syncConfig: params.syncConfig ?? null,
      history: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  public static fromServerDTO(dto: SettingServerDTO): Setting {
    const id = SettingIdType.of(dto.id);
    return new Setting(id, {
      key: dto.key,
      name: dto.name,
      description: dto.description,
      valueType: dto.valueType,
      value: dto.value,
      defaultValue: dto.defaultValue,
      scope: dto.scope,
      accountId: dto.accountId,
      deviceId: dto.deviceId,
      groupId: dto.groupId as SettingGroupId | null,
      validation: dto.validation ? ValidationRule.fromDTO(dto.validation) : null,
      ui: dto.ui ? UIConfig.fromDTO(dto.ui) : null,
      isEncrypted: dto.isEncrypted,
      isReadOnly: dto.isReadOnly,
      isSystemSetting: dto.isSystemSetting,
      syncConfig: dto.syncConfig ? SyncConfig.fromDTO(dto.syncConfig) : null,
      history: [],
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  public static fromPersistenceDTO(dto: SettingPersistenceDTO): Setting {
    const id = SettingIdType.of(dto.id);
    return new Setting(id, {
      key: dto.key,
      name: dto.name,
      description: dto.description,
      valueType: dto.valueType,
      value: JSON.parse(dto.value),
      defaultValue: JSON.parse(dto.defaultValue),
      scope: dto.scope,
      accountId: dto.accountId,
      deviceId: dto.deviceId,
      groupId: dto.groupId as SettingGroupId | null,
      validation: dto.validation ? ValidationRule.fromDTO(JSON.parse(dto.validation)) : null,
      ui: dto.ui ? UIConfig.fromDTO(JSON.parse(dto.ui)) : null,
      isEncrypted: dto.isEncrypted,
      isReadOnly: dto.isReadOnly,
      isSystemSetting: dto.isSystemSetting,
      syncConfig: dto.syncConfig ? SyncConfig.fromDTO(JSON.parse(dto.syncConfig)) : null,
      history: [],
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    });
  }
}
