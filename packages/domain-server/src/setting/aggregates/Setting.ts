/**
 * Setting 聚合根实现
 * 实现 SettingServer 接口
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  SettingClientDTO,
  SettingPersistenceDTO,
  SettingServer,
  SettingServerDTO,
} from '@dailyuse/contracts/setting';
import { SettingScope, SettingValueType } from '@dailyuse/contracts/setting';
import { ValidationRule } from '../value-objects/ValidationRule';
import { UIConfig } from '../value-objects/UIConfig';
import { SyncConfig } from '../value-objects/SyncConfig';
import { SettingHistory } from '../entities/SettingHistory';

/**
 * Setting 聚合根
 */
export class Setting extends AggregateRoot implements SettingServer {
  private _key: string;
  private _name: string;
  private _description?: string | null;
  private _valueType: SettingValueType;
  private _value: any;
  private _defaultValue: any;
  private _scope: SettingScope;
  private _accountUuid?: string | null;
  private _deviceId?: string | null;
  private _groupUuid?: string | null;
  private _validation?: ValidationRule | null;
  private _ui?: UIConfig | null;
  private _isEncrypted: boolean;
  private _isReadOnly: boolean;
  private _isSystemSetting: boolean;
  private _syncConfig?: SyncConfig | null;
  private _history: SettingHistory[];
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt?: number | null;

  private constructor(params: {
    uuid?: string;
    key: string;
    name: string;
    description?: string | null;
    valueType: SettingValueType;
    value: any;
    defaultValue: any;
    scope: SettingScope;
    accountUuid?: string | null;
    deviceId?: string | null;
    groupUuid?: string | null;
    validation?: ValidationRule | null;
    ui?: UIConfig | null;
    isEncrypted?: boolean;
    isReadOnly?: boolean;
    isSystemSetting?: boolean;
    syncConfig?: SyncConfig | null;
    history?: SettingHistory[];
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
  }) {
    super(params.uuid ?? AggregateRoot.generateUUID());
    this._key = params.key;
    this._name = params.name;
    this._description = params.description ?? null;
    this._valueType = params.valueType;
    this._value = params.value;
    this._defaultValue = params.defaultValue;
    this._scope = params.scope;
    this._accountUuid = params.accountUuid ?? null;
    this._deviceId = params.deviceId ?? null;
    this._groupUuid = params.groupUuid ?? null;
    this._validation = params.validation ?? null;
    this._ui = params.ui ?? null;
    this._isEncrypted = params.isEncrypted ?? false;
    this._isReadOnly = params.isReadOnly ?? false;
    this._isSystemSetting = params.isSystemSetting ?? false;
    this._syncConfig = params.syncConfig ?? null;
    this._history = params.history ?? [];
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt ?? null;
  }

  // Getters
  public get key(): string {
    return this._key;
  }
  public get name(): string {
    return this._name;
  }
  public get description(): string | null | undefined {
    return this._description;
  }
  public get valueType(): SettingValueType {
    return this._valueType;
  }
  public get value(): any {
    return this._value;
  }
  public get defaultValue(): any {
    return this._defaultValue;
  }
  public get scope(): SettingScope {
    return this._scope;
  }
  public get accountUuid(): string | null | undefined {
    return this._accountUuid;
  }
  public get deviceId(): string | null | undefined {
    return this._deviceId;
  }
  public get groupUuid(): string | null | undefined {
    return this._groupUuid;
  }
  public get validation(): ValidationRule | null | undefined {
    return this._validation;
  }
  public get ui(): UIConfig | null | undefined {
    return this._ui;
  }
  public get isEncrypted(): boolean {
    return this._isEncrypted;
  }
  public get isReadOnly(): boolean {
    return this._isReadOnly;
  }
  public get isSystemSetting(): boolean {
    return this._isSystemSetting;
  }
  public get syncConfig(): SyncConfig | null | undefined {
    return this._syncConfig;
  }
  public get history(): SettingHistory[] | null | undefined {
    return this._history.length > 0 ? this._history : null;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }
  public get updatedAt(): Date {
    return this._updatedAt;
  }
  public get deletedAt(): Date | null | undefined {
    return this._deletedAt;
  }

  /**
   * 创建新的 Setting
   */
  public static create(params: {
    key: string;
    name: string;
    description?: string;
    valueType: SettingValueType;
    value: any;
    defaultValue: any;
    scope: SettingScope;
    accountUuid?: string;
    deviceId?: string;
    groupUuid?: string;
    validation?: ValidationRule;
    ui?: UIConfig;
    isEncrypted?: boolean;
    isReadOnly?: boolean;
    isSystemSetting?: boolean;
    syncConfig?: SyncConfig;
  }): Setting {
    if (!params.key || params.key.trim().length === 0) {
      throw new Error('Key is required');
    }
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Name is required');
    }

    const now = Date.now();
    return new Setting({
      key: params.key.trim(),
      name: params.name.trim(),
      description: params.description?.trim() || null,
      valueType: params.valueType,
      value: params.value,
      defaultValue: params.defaultValue,
      scope: params.scope,
      accountUuid: params.accountUuid,
      deviceId: params.deviceId,
      groupUuid: params.groupUuid,
      validation: params.validation,
      ui: params.ui,
      isEncrypted: params.isEncrypted,
      isReadOnly: params.isReadOnly,
      isSystemSetting: params.isSystemSetting,
      syncConfig: params.syncConfig,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 设置值
   */
  public setValue(newValue: any, operatorUuid?: string): void {
    if (this._isReadOnly) {
      throw new Error('Setting is read-only');
    }

    // 验证
    if (this._validation) {
      const result = this._validation.validate(newValue);
      if (!result.valid) {
        throw new Error(result.error || 'Validation failed');
      }
    }

    // 记录历史
    const history = SettingHistory.create({
      settingUuid: this.uuid,
      settingKey: this._key,
      oldValue: this._value,
      newValue,
      operatorUuid,
      operatorType: operatorUuid ? 'USER' : 'SYSTEM',
    });
    this._history.push(history);

    this._value = newValue;
    this._updatedAt = new Date();
  }

  /**
   * 重置为默认值
   */
  public resetToDefault(): void {
    if (this._isReadOnly) {
      throw new Error('Setting is read-only');
    }

    this.setValue(this._defaultValue);
  }

  /**
   * 获取值
   */
  public getValue(): any {
    return this._value;
  }

  /**
   * 获取类型化的值
   */
  public getTypedValue<T>(): T {
    return this._value as T;
  }

  /**
   * 验证当前值
   */
  public validate(value: any): { valid: boolean; error?: string } {
    if (!this._validation) {
      return { valid: true };
    }
    return this._validation.validate(value);
  }

  /**
   * 加密设置值
   */
  public encrypt(): void {
    if (this._isEncrypted) {
      // 实际的加密逻辑应该由外部服务提供
      // 这里只标记为已加密
      this._updatedAt = new Date();
    }
  }

  /**
   * 解密设置值
   */
  public decrypt(): any {
    if (this._isEncrypted) {
      // 实际的解密逻辑应该由外部服务提供
      // 这里只返回当前值
      return this._value;
    }
    return this._value;
  }

  /**
   * 同步设置
   */
  public async sync(): Promise<void> {
    if (this._syncConfig && this._syncConfig.isSyncEnabled()) {
      // 实际的同步逻辑应该由外部服务提供
      this._updatedAt = new Date();
    }
  }

  /**
   * 添加历史记录
   */
  public addHistory(oldValue: any, newValue: any, operatorUuid?: string): void {
    const history = SettingHistory.create({
      settingUuid: this.uuid,
      settingKey: this._key,
      oldValue,
      newValue,
      operatorUuid,
      operatorType: operatorUuid ? 'USER' : 'SYSTEM',
    });
    this._history.push(history);
  }

  /**
   * 获取历史记录
   */
  public getHistory(limit?: number): SettingHistory[] {
    if (!limit) {
      return [...this._history];
    }
    return this._history.slice(-limit);
  }

  /**
   * 检查是否为默认值
   */
  public isDefault(): boolean {
    return this._value === this._defaultValue;
  }

  /**
   * 检查是否已更改
   */
  public hasChanged(): boolean {
    return this._value !== this._defaultValue;
  }

  /**
   * 软删除
   */
  public softDelete(): void {
    if (this._deletedAt) return;
    this._deletedAt = new Date();
    this._updatedAt = this._deletedAt;
  }

  // ========== Helper Methods for Client DTO ==========

  private getIsDeleted(): boolean {
    return !!this._deletedAt;
  }

  private getDisplayName(): string {
    return this._name;
  }

  private getDisplayValue(): string {
    if (this._value === null || this._value === undefined) {
      return '未设置';
    }
    switch (this._valueType) {
      case SettingValueType.BOOLEAN:
        return this._value ? '是' : '否';
      case SettingValueType.PASSWORD:
        return '********';
      case SettingValueType.OBJECT:
      case SettingValueType.ARRAY:
        try {
          return JSON.stringify(this._value, null, 2);
        } catch {
          return '[无法显示的值]';
        }
      default:
        return String(this._value);
    }
  }

  /**
   * 转换为 ClientDTO
   */
  public toClientDTO(): SettingClientDTO {
    return {
      uuid: this.uuid,
      key: this._key,
      name: this._name,
      description: this._description,
      valueType: this._valueType,
      value: this._value,
      defaultValue: this._defaultValue,
      scope: this._scope,
      accountUuid: this._accountUuid,
      deviceId: this._deviceId,
      groupUuid: this._groupUuid,
      validation: this._validation?.toClientDTO(),
      ui: this._ui?.toClientDTO(),
      isEncrypted: this._isEncrypted,
      isReadOnly: this._isReadOnly,
      isSystemSetting: this._isSystemSetting,
      syncConfig: this._syncConfig?.toClientDTO(),
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt.getTime(),
      // Computed properties
      isDeleted: this.getIsDeleted(),
      isDefault: this.isDefault(),
      hasChanged: this.hasChanged(),
      displayName: this.getDisplayName(),
      displayValue: this.getDisplayValue(),
    };
  }

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(includeHistory?: boolean): SettingServerDTO {
    return {
      uuid: this.uuid,
      key: this._key,
      name: this._name,
      description: this._description,
      valueType: this._valueType,
      value: this._value,
      defaultValue: this._defaultValue,
      scope: this._scope,
      accountUuid: this._accountUuid,
      deviceId: this._deviceId,
      groupUuid: this._groupUuid,
      validation: this._validation?.toServerDTO(),
      ui: this._ui?.toServerDTO(),
      isEncrypted: this._isEncrypted,
      isReadOnly: this._isReadOnly,
      isSystemSetting: this._isSystemSetting,
      syncConfig: this._syncConfig?.toServerDTO(),
      history:
        includeHistory && this._history.length > 0
          ? this._history.map((h) => h.toServerDTO())
          : null,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt.getTime(),
    };
  }

  /**
   * 转换为 PersistenceDTO
   */
  public toPersistenceDTO(): SettingPersistenceDTO {
    return {
      uuid: this.uuid,
      key: this._key,
      name: this._name,
      description: this._description,
      valueType: this._valueType,
      value: JSON.stringify(this._value),
      defaultValue: JSON.stringify(this._defaultValue),
      scope: this._scope,
      accountUuid: this._accountUuid,
      deviceId: this._deviceId,
      groupUuid: this._groupUuid,
      validation: this._validation ? JSON.stringify(this._validation.toServerDTO()) : null,
      ui: this._ui ? JSON.stringify(this._ui.toServerDTO()) : null,
      isEncrypted: this._isEncrypted,
      isReadOnly: this._isReadOnly,
      isSystemSetting: this._isSystemSetting,
      syncConfig: this._syncConfig ? JSON.stringify(this._syncConfig.toServerDTO()) : null,
      history: JSON.stringify(this._history.map((h) => h.toServerDTO())),
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt.getTime(),
    };
  }

  /**
   * 从 ServerDTO 重建
   */
  public static fromServerDTO(dto: SettingServerDTO): Setting {
    return new Setting({
      uuid: dto.uuid,
      key: dto.key,
      name: dto.name,
      description: dto.description,
      valueType: dto.valueType as SettingValueType,
      value: dto.value,
      defaultValue: dto.defaultValue,
      scope: dto.scope as SettingScope,
      accountUuid: dto.accountUuid,
      deviceId: dto.deviceId,
      groupUuid: dto.groupUuid,
      validation: dto.validation ? ValidationRule.fromServerDTO(dto.validation) : null,
      ui: dto.ui ? UIConfig.fromServerDTO(dto.ui) : null,
      isEncrypted: dto.isEncrypted,
      isReadOnly: dto.isReadOnly,
      isSystemSetting: dto.isSystemSetting,
      syncConfig: dto.syncConfig ? SyncConfig.fromServerDTO(dto.syncConfig) : null,
      history: dto.history ? dto.history.map((h) => SettingHistory.fromServerDTO(h)) : [],
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  /**
   * 从 PersistenceDTO 重建
   */
  public static fromPersistenceDTO(dto: SettingPersistenceDTO): Setting {
    const historyData = JSON.parse(dto.history) as any[];
    return new Setting({
      uuid: dto.uuid,
      key: dto.key,
      name: dto.name,
      description: dto.description,
      valueType: dto.valueType as SettingValueType,
      value: JSON.parse(dto.value),
      defaultValue: JSON.parse(dto.defaultValue),
      scope: dto.scope as SettingScope,
      accountUuid: dto.accountUuid,
      deviceId: dto.deviceId,
      groupUuid: dto.groupUuid,
      validation: dto.validation ? ValidationRule.fromServerDTO(JSON.parse(dto.validation)) : null,
      ui: dto.ui ? UIConfig.fromServerDTO(JSON.parse(dto.ui)) : null,
      isEncrypted: dto.isEncrypted,
      isReadOnly: dto.isReadOnly,
      isSystemSetting: dto.isSystemSetting,
      syncConfig: dto.syncConfig ? SyncConfig.fromServerDTO(JSON.parse(dto.syncConfig)) : null,
      history: historyData.map((h) => SettingHistory.fromServerDTO(h)),
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }
}
