/**
 * SettingGroup Entity - Server Implementation
 * 设置分组实体 - 服务端实现
 */

import { Entity } from '@dailyuse/utils';
import type { SettingGroupId, TransferDate, DomainDate } from '@dailyuse/contracts/primitives';
import { SettingGroupId as SettingGroupIdType } from '@/domain-shared/value-objects/setting-group-id';
import { SettingItem, type SettingItemServerDTO, type SettingItemClientDTO } from './setting-item';

// ============ Local Type Definitions ============
// TODO: Move these to @dailyuse/contracts/setting when finalizing API

/** Server DTO */
export interface SettingGroupServerDTO {
  id: SettingGroupId;
  name: string;
  description: string | null;
  icon: string | null;
  parentGroupId: SettingGroupId | null;
  path: string;
  level: number;
  sortOrder: number;
  settings: SettingItemServerDTO[];
  isSystemGroup: boolean;
  isCollapsed: boolean;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

/** Client DTO */
export interface SettingGroupClientDTO {
  id: SettingGroupId;
  name: string;
  description: string | null;
  icon: string | null;
  parentGroupId: SettingGroupId | null;
  path: string;
  level: number;
  sortOrder: number;
  settings: SettingItemClientDTO[];
  isSystemGroup: boolean;
  isCollapsed: boolean;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
  // Computed
  settingsCount: number;
  hasChildren: boolean;
}

/** Domain state for SettingGroup */
export interface SettingGroupState {
  id: SettingGroupId;
  name: string;
  description: string | null;
  icon: string | null;
  parentGroupId: SettingGroupId | null;
  path: string;
  level: number;
  sortOrder: number;
  settings: SettingItem[];
  isSystemGroup: boolean;
  isCollapsed: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * 设置分组实体
 * 表示设置的层级分组结构
 */
export class SettingGroup extends Entity<SettingGroupId> {
  private _name: string;
  private _description: string | null;
  private _icon: string | null;
  private _parentGroupId: SettingGroupId | null;
  private _path: string;
  private _level: number;
  private _sortOrder: number;
  private _settings: SettingItem[];
  private _isSystemGroup: boolean;
  private _isCollapsed: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private constructor(state: SettingGroupState) {
    super(state.id);
    this._name = state.name;
    this._description = state.description;
    this._icon = state.icon;
    this._parentGroupId = state.parentGroupId;
    this._path = state.path;
    this._level = state.level;
    this._sortOrder = state.sortOrder;
    this._settings = state.settings;
    this._isSystemGroup = state.isSystemGroup;
    this._isCollapsed = state.isCollapsed;
    this._createdAt = state.createdAt;
    this._updatedAt = state.updatedAt;
    this._deletedAt = state.deletedAt;
  }

  // ============ Getters ============

  public get name(): string { return this._name; }
  public get description(): string | null { return this._description; }
  public get icon(): string | null { return this._icon; }
  public get parentGroupId(): SettingGroupId | null { return this._parentGroupId; }
  public get path(): string { return this._path; }
  public get level(): number { return this._level; }
  public get sortOrder(): number { return this._sortOrder; }
  public get settings(): SettingItem[] { return [...this._settings]; }
  public get isSystemGroup(): boolean { return this._isSystemGroup; }
  public get isCollapsed(): boolean { return this._isCollapsed; }
  public get createdAt(): DomainDate { return this._createdAt; }
  public get updatedAt(): DomainDate { return this._updatedAt; }
  public get deletedAt(): DomainDate | null { return this._deletedAt; }

  // ============ 业务方法 ============

  public addSetting(setting: SettingItem): void {
    const exists = this._settings.find(s => s.id === setting.id);
    if (exists) {
      throw new Error(`Setting ${setting.key} already exists in group`);
    }
    this._settings.push(setting);
    this._updatedAt = new Date();
  }

  public removeSetting(settingId: string): void {
    const index = this._settings.findIndex(s => s.id === settingId);
    if (index === -1) {
      throw new Error(`Setting ${settingId} not found in group`);
    }
    this._settings.splice(index, 1);
    this._updatedAt = new Date();
  }

  public getSetting(settingId: string): SettingItem | null {
    return this._settings.find(s => s.id === settingId) ?? null;
  }

  public toggleCollapse(): void {
    this._isCollapsed = !this._isCollapsed;
    this._updatedAt = new Date();
  }

  public delete(): void {
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  public restore(): void {
    this._deletedAt = null;
    this._updatedAt = new Date();
  }

  // ============ DTO 转换 ============

  public toServerDTO(): SettingGroupServerDTO {
    return {
      id: this.id,
      name: this._name,
      description: this._description,
      icon: this._icon,
      parentGroupId: this._parentGroupId,
      path: this._path,
      level: this._level,
      sortOrder: this._sortOrder,
      settings: this._settings.map(s => s.toServerDTO()),
      isSystemGroup: this._isSystemGroup,
      isCollapsed: this._isCollapsed,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }

  public toClientDTO(): SettingGroupClientDTO {
    return {
      id: this.id,
      name: this._name,
      description: this._description,
      icon: this._icon,
      parentGroupId: this._parentGroupId,
      path: this._path,
      level: this._level,
      sortOrder: this._sortOrder,
      settings: this._settings.map(s => s.toClientDTO()),
      isSystemGroup: this._isSystemGroup,
      isCollapsed: this._isCollapsed,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      // Computed
      settingsCount: this._settings.length,
      hasChildren: this._settings.length > 0,
    };
  }

  // ============ 工厂方法 ============

  /**
   * Reconstruct from persisted state
   */
  public static load(state: SettingGroupState): SettingGroup {
    return new SettingGroup(state);
  }

  public static create(params: {
    name: string;
    description?: string;
    icon?: string;
    parentGroupId?: SettingGroupId;
    path: string;
    level?: number;
    sortOrder?: number;
    isSystemGroup?: boolean;
    isCollapsed?: boolean;
  }): SettingGroup {
    const id = SettingGroupIdType.of(SettingGroupIdType.generate());
    const now = new Date();
    return new SettingGroup({
      id,
      name: params.name,
      description: params.description ?? null,
      icon: params.icon ?? null,
      parentGroupId: params.parentGroupId ?? null,
      path: params.path,
      level: params.level ?? 0,
      sortOrder: params.sortOrder ?? 0,
      settings: [],
      isSystemGroup: params.isSystemGroup ?? false,
      isCollapsed: params.isCollapsed ?? false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }
}
