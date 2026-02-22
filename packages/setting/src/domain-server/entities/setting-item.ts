/**
 * SettingItem Entity - Server Implementation
 * 设置项实体 - 服务端实现
 */

import { Entity } from '@dailyuse/utils';
import type { SettingEntryId, SettingGroupId, TransferDate, DomainDate } from '@dailyuse/contracts/primitives';
import { SettingValueType, type UIConfigDTO } from '@dailyuse/contracts/setting';
import { SettingEntryId as SettingEntryIdType } from '@/domain-shared/value-objects/setting-entry-id';
import { UIConfig } from '@/domain-shared/value-objects/ui-config';

// ============ Local Type Definitions ============
// TODO: Move these to @dailyuse/contracts/setting when finalizing API

/** Server DTO - 用于 Server 和 Client 传输 */
export interface SettingItemServerDTO {
  id: SettingEntryId;
  groupId: SettingGroupId;
  key: string;
  name: string;
  description: string | null;
  value: unknown;
  defaultValue: unknown;
  valueType: SettingValueType;
  ui: UIConfigDTO;
  sortOrder: number;
  isReadOnly: boolean;
  isVisible: boolean;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/** Client DTO - 用于展示层 */
export interface SettingItemClientDTO extends SettingItemServerDTO {
  isDefault: boolean;
  displayValue: string;
  canEdit: boolean;
}

/** Domain state for SettingItem */
export interface SettingItemState {
  id: SettingEntryId;
  groupId: SettingGroupId;
  key: string;
  name: string;
  description: string | null;
  value: unknown;
  defaultValue: unknown;
  valueType: SettingValueType;
  ui: UIConfig;
  sortOrder: number;
  isReadOnly: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 设置项实体
 * 表示设置组中的一个配置项
 */
export class SettingItem extends Entity<SettingEntryId> {
  private _groupId: SettingGroupId;
  private _key: string;
  private _name: string;
  private _description: string | null;
  private _value: unknown;
  private _defaultValue: unknown;
  private _valueType: SettingValueType;
  private _ui: UIConfig;
  private _sortOrder: number;
  private _isReadOnly: boolean;
  private _isVisible: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(state: SettingItemState) {
    super(state.id);
    this._groupId = state.groupId;
    this._key = state.key;
    this._name = state.name;
    this._description = state.description;
    this._value = state.value;
    this._defaultValue = state.defaultValue;
    this._valueType = state.valueType;
    this._ui = state.ui;
    this._sortOrder = state.sortOrder;
    this._isReadOnly = state.isReadOnly;
    this._isVisible = state.isVisible;
    this._createdAt = state.createdAt;
    this._updatedAt = state.updatedAt;
  }

  // ============ Getters ============

  public get groupId(): SettingGroupId {
    return this._groupId;
  }

  public get key(): string {
    return this._key;
  }

  public get name(): string {
    return this._name;
  }

  public get description(): string | null {
    return this._description;
  }

  public get value(): unknown {
    return this._value;
  }

  public get defaultValue(): unknown {
    return this._defaultValue;
  }

  public get valueType(): SettingValueType {
    return this._valueType;
  }

  public get ui(): UIConfig {
    return this._ui;
  }

  public get sortOrder(): number {
    return this._sortOrder;
  }

  public get isReadOnly(): boolean {
    return this._isReadOnly;
  }

  public get isVisible(): boolean {
    return this._isVisible;
  }

  public get createdAt(): DomainDate {
    return this._createdAt;
  }

  public get updatedAt(): DomainDate {
    return this._updatedAt;
  }

  // ============ 业务方法 ============

  /**
   * 设置值
   */
  public setValue(newValue: unknown): void {
    if (this._isReadOnly) {
      throw new Error(`Setting item ${this._key} is read-only`);
    }

    this._value = newValue;
    this._updatedAt = new Date();
  }

  /**
   * 重置为默认值
   */
  public resetToDefault(): void {
    if (this._isReadOnly) {
      throw new Error(`Setting item ${this._key} is read-only`);
    }

    this._value = this._defaultValue;
    this._updatedAt = new Date();
  }

  /**
   * 检查是否为默认值
   */
  public isDefault(): boolean {
    return JSON.stringify(this._value) === JSON.stringify(this._defaultValue);
  }

  // ============ Helper Methods for Client DTO ============

  private getDisplayValue(): string {
    if (this._value === null || this._value === undefined) {
      return '未设置';
    }
    switch (this._valueType) {
      case SettingValueType.Boolean:
        return this._value ? '是' : '否';
      case SettingValueType.Password:
        return '********';
      case SettingValueType.Object:
      case SettingValueType.Array:
        try {
          return JSON.stringify(this._value, null, 2);
        } catch {
          return '[无法显示的值]';
        }
      default:
        return String(this._value);
    }
  }

  private getCanEdit(): boolean {
    return !this._isReadOnly;
  }

  // ============ DTO 转换 ============

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): SettingItemServerDTO {
    return {
      id: this.id,
      groupId: this._groupId,
      key: this._key,
      name: this._name,
      description: this._description,
      value: this._value,
      defaultValue: this._defaultValue,
      valueType: this._valueType,
      ui: this._ui.toDTO(),
      sortOrder: this._sortOrder,
      isReadOnly: this._isReadOnly,
      isVisible: this._isVisible,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  public toClientDTO(): SettingItemClientDTO {
    return {
      ...this.toServerDTO(),
      // Computed properties
      isDefault: this.isDefault(),
      displayValue: this.getDisplayValue(),
      canEdit: this.getCanEdit(),
    };
  }

  // ============ 工厂方法 ============

  /**
   * Reconstruct from persisted state
   */
  public static load(state: SettingItemState): SettingItem {
    return new SettingItem(state);
  }

  /**
   * 创建新的设置项
   */
  public static create(params: {
    groupId: SettingGroupId;
    key: string;
    name: string;
    description?: string;
    value: unknown;
    defaultValue: unknown;
    valueType: SettingValueType;
    ui: UIConfig;
    sortOrder?: number;
    isReadOnly?: boolean;
    isVisible?: boolean;
  }): SettingItem {
    const id = SettingEntryIdType.of(SettingEntryIdType.generate());
    const now = new Date();
    return new SettingItem({
      id,
      groupId: params.groupId,
      key: params.key,
      name: params.name,
      description: params.description ?? null,
      value: params.value,
      defaultValue: params.defaultValue,
      valueType: params.valueType,
      ui: params.ui,
      sortOrder: params.sortOrder ?? 0,
      isReadOnly: params.isReadOnly ?? false,
      isVisible: params.isVisible ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }
}
