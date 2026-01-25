/**
 * SettingItem Entity - Server Implementation
 * 设置项实体 - 服务端实现
 */

import { Entity } from '@dailyuse/utils';
import type {
  SettingItemClientDTO,
  SettingItemPersistenceDTO,
  SettingItemServer,
  SettingItemServerDTO,
} from '@dailyuse/contracts/setting';
import { SettingValueType } from '@dailyuse/contracts/setting';
import { UIConfig } from '../value-objects/UIConfig';

/**
 * 设置项实体
 * 表示设置组中的一个配置项
 */
export class SettingItem extends Entity implements SettingItemServer {
  private _groupUuid: string;
  private _key: string;
  private _name: string;
  private _description?: string | null;
  private _value: any;
  private _defaultValue: any;
  private _valueType: SettingValueType;
  private _ui: UIConfig;
  private _sortOrder: number;
  private _isReadOnly: boolean;
  private _isVisible: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(params: {
    uuid: string;
    groupUuid: string;
    key: string;
    name: string;
    description?: string | null;
    value: any;
    defaultValue: any;
    valueType: SettingValueType;
    ui: UIConfig;
    sortOrder: number;
    isReadOnly: boolean;
    isVisible: boolean;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid);
    this._groupUuid = params.groupUuid;
    this._key = params.key;
    this._name = params.name;
    this._description = params.description;
    this._value = params.value;
    this._defaultValue = params.defaultValue;
    this._valueType = params.valueType;
    this._ui = params.ui;
    this._sortOrder = params.sortOrder;
    this._isReadOnly = params.isReadOnly;
    this._isVisible = params.isVisible;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ============ Getters ============

  public get groupUuid(): string {
    return this._groupUuid;
  }

  public get key(): string {
    return this._key;
  }

  public get name(): string {
    return this._name;
  }

  public get description(): string | null | undefined {
    return this._description;
  }

  public get value(): any {
    return this._value;
  }

  public get defaultValue(): any {
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

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // ============ 业务方法 ============

  /**
   * 设置值
   */
  public setValue(newValue: any): void {
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

  private getCanEdit(): boolean {
    return !this._isReadOnly;
  }

  // ============ DTO 转换 ============

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): SettingItemServerDTO {
    return {
      uuid: this.uuid,
      groupUuid: this._groupUuid,
      key: this._key,
      name: this._name,
      description: this._description,
      value: this._value,
      defaultValue: this._defaultValue,
      valueType: this._valueType,
      ui: this._ui.toServerDTO(),
      sortOrder: this._sortOrder,
      isReadOnly: this._isReadOnly,
      isVisible: this._isVisible,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  public toClientDTO(): SettingItemClientDTO {
    return {
      uuid: this.uuid,
      groupUuid: this._groupUuid,
      key: this._key,
      name: this._name,
      description: this._description,
      value: this._value,
      defaultValue: this._defaultValue,
      valueType: this._valueType,
      ui: this._ui.toClientDTO(),
      sortOrder: this._sortOrder,
      isReadOnly: this._isReadOnly,
      isVisible: this._isVisible,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      // Computed properties
      isDefault: this.isDefault(),
      displayValue: this.getDisplayValue(),
      canEdit: this.getCanEdit(),
    };
  }

  /**
   * 转换为 PersistenceDTO
   */
  public toPersistenceDTO(): SettingItemPersistenceDTO {
    return {
      uuid: this.uuid,
      groupUuid: this._groupUuid,
      key: this._key,
      name: this._name,
      description: this._description,
      value: JSON.stringify(this._value),
      defaultValue: JSON.stringify(this._defaultValue),
      valueType: this._valueType,
      ui: JSON.stringify(this._ui.toServerDTO()),
      sortOrder: this._sortOrder,
      isReadOnly: this._isReadOnly,
      isVisible: this._isVisible,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  // ============ 工厂方法 ============

  /**
   * 创建新的设置项
   */
  public static create(params: {
    groupUuid: string;
    key: string;
    name: string;
    description?: string;
    value: any;
    defaultValue: any;
    valueType: SettingValueType;
    ui: UIConfig;
    sortOrder?: number;
    isReadOnly?: boolean;
    isVisible?: boolean;
  }): SettingItem {
    const now = Date.now();
    return new SettingItem({
      uuid: crypto.randomUUID(),
      groupUuid: params.groupUuid,
      key: params.key,
      name: params.name,
      description: params.description,
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

  /**
   * 从 ServerDTO 重建
   */
  public static fromServerDTO(dto: SettingItemServerDTO): SettingItem {
    return new SettingItem({
      uuid: dto.uuid,
      groupUuid: dto.groupUuid,
      key: dto.key,
      name: dto.name,
      description: dto.description,
      value: dto.value,
      defaultValue: dto.defaultValue,
      valueType: dto.valueType as SettingValueType,
      ui: UIConfig.fromServerDTO(dto.ui),
      sortOrder: dto.sortOrder,
      isReadOnly: dto.isReadOnly,
      isVisible: dto.isVisible,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * 从 PersistenceDTO 重建
   */
  public static fromPersistenceDTO(dto: SettingItemPersistenceDTO): SettingItem {
    return new SettingItem({
      uuid: dto.uuid,
      groupUuid: dto.groupUuid,
      key: dto.key,
      name: dto.name,
      description: dto.description,
      value: JSON.parse(dto.value),
      defaultValue: JSON.parse(dto.defaultValue),
      valueType: dto.valueType as SettingValueType,
      ui: UIConfig.fromServerDTO(JSON.parse(dto.ui)),
      sortOrder: dto.sortOrder,
      isReadOnly: dto.isReadOnly,
      isVisible: dto.isVisible,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }
}
