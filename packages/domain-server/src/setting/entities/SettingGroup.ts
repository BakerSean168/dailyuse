/**
 * SettingGroup Entity - Server Implementation
 * 设置分组实体 - 服务端实现
 */

import { Entity } from '@dailyuse/utils';
import type {
  SettingGroupClientDTO,
  SettingGroupPersistenceDTO,
  SettingGroupServer,
  SettingGroupServerDTO,
} from '@dailyuse/contracts/setting';
import { SettingItem } from './SettingItem';

/**
 * 设置分组实体
 * 表示设置的层级分组结构
 */
export class SettingGroup extends Entity implements SettingGroupServer {
  private _name: string;
  private _description?: string | null;
  private _icon?: string | null;
  private _parentGroupUuid?: string | null;
  private _path: string;
  private _level: number;
  private _sortOrder: number;
  private _settings: SettingItem[];
  private _isSystemGroup: boolean;
  private _isCollapsed: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt?: number | null;

  private constructor(params: {
    uuid: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    parentGroupUuid?: string | null;
    path: string;
    level: number;
    sortOrder: number;
    settings: SettingItem[];
    isSystemGroup: boolean;
    isCollapsed: boolean;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
  }) {
    super(params.uuid);
    this._name = params.name;
    this._description = params.description;
    this._icon = params.icon;
    this._parentGroupUuid = params.parentGroupUuid;
    this._path = params.path;
    this._level = params.level;
    this._sortOrder = params.sortOrder;
    this._settings = params.settings;
    this._isSystemGroup = params.isSystemGroup;
    this._isCollapsed = params.isCollapsed;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ============ Getters ============

  public get name(): string {
    return this._name;
  }

  public get description(): string | null | undefined {
    return this._description;
  }

  public get icon(): string | null | undefined {
    return this._icon;
  }

  public get parentGroupUuid(): string | null | undefined {
    return this._parentGroupUuid;
  }

  public get path(): string {
    return this._path;
  }

  public get level(): number {
    return this._level;
  }

  public get sortOrder(): number {
    return this._sortOrder;
  }

  public get settings(): SettingItem[] | null | undefined {
    return this._settings.length > 0 ? this._settings : null;
  }

  public get isSystemGroup(): boolean {
    return this._isSystemGroup;
  }

  public get isCollapsed(): boolean {
    return this._isCollapsed;
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

  // ============ 业务方法 ============

  /**
   * 添加设置项
   */
  public addSetting(setting: SettingItem): void {
    // 检查是否已存在
    const exists = this._settings.some((s) => s.uuid === setting.uuid);
    if (exists) {
      throw new Error(`Setting ${setting.uuid} already exists in group`);
    }

    this._settings.push(setting);
    this._updatedAt = new Date();
  }

  /**
   * 移除设置项
   */
  public removeSetting(settingUuid: string): void {
    const index = this._settings.findIndex((s) => s.uuid === settingUuid);
    if (index === -1) {
      throw new Error(`Setting ${settingUuid} not found in group`);
    }

    this._settings.splice(index, 1);
    this._updatedAt = new Date();
  }

  /**
   * 重新排序设置项
   */
  public reorderSettings(settingUuids: string[]): void {
    // 验证所有 UUID 都存在
    const allUuids = new Set(this._settings.map((s) => s.uuid));
    for (const uuid of settingUuids) {
      if (!allUuids.has(uuid)) {
        throw new Error(`Setting ${uuid} not found in group`);
      }
    }

    // 重新排序
    const orderedSettings: SettingItem[] = [];
    for (const uuid of settingUuids) {
      const setting = this._settings.find((s) => s.uuid === uuid)!;
      orderedSettings.push(setting);
    }

    this._settings = orderedSettings;
    this._updatedAt = new Date();
  }

  /**
   * 获取所有设置项
   */
  public getSettings(): SettingItem[] {
    return [...this._settings];
  }

  /**
   * 根据 key 获取设置项
   */
  public getSettingByKey(key: string): SettingItem | null {
    return this._settings.find((s) => s.key === key) ?? null;
  }

  /**
   * 折叠分组
   */
  public collapse(): void {
    this._isCollapsed = true;
    this._updatedAt = new Date();
  }

  /**
   * 展开分组
   */
  public expand(): void {
    this._isCollapsed = false;
    this._updatedAt = new Date();
  }

  /**
   * 软删除
   */
  public softDelete(): void {
    if (this._deletedAt) return;
    this._deletedAt = new Date();
    this._updatedAt = this._deletedAt;
  }

  /**
   * 恢复
   */
  public restore(): void {
    this._deletedAt = null;
    this._updatedAt = new Date();
  }

  // ============ Helper Methods for Client DTO ============

  private getIsDeleted(): boolean {
    return !!this._deletedAt;
  }

  private getSettingCount(): number {
    return this._settings.length;
  }

  private getDisplayName(): string {
    return this._name;
  }

  // ============ DTO 转换 ============

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): SettingGroupServerDTO {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      icon: this._icon,
      parentGroupUuid: this._parentGroupUuid,
      path: this._path,
      level: this._level,
      sortOrder: this._sortOrder,
      settings: this._settings.length > 0 ? this._settings.map((s) => s.toServerDTO()) : null,
      isSystemGroup: this._isSystemGroup,
      isCollapsed: this._isCollapsed,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt.getTime(),
    };
  }

  public toClientDTO(): SettingGroupClientDTO {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      icon: this._icon,
      parentGroupUuid: this._parentGroupUuid,
      path: this._path,
      level: this._level,
      sortOrder: this._sortOrder,
      settings: this._settings.length > 0 ? this._settings.map((s) => s.toClientDTO()) : null,
      isSystemGroup: this._isSystemGroup,
      isCollapsed: this._isCollapsed,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt.getTime(),
      // Computed properties
      isDeleted: this.getIsDeleted(),
      settingCount: this.getSettingCount(),
      displayName: this.getDisplayName(),
    };
  }

  /**
   * 转换为 PersistenceDTO
   */
  public toPersistenceDTO(): SettingGroupPersistenceDTO {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      icon: this._icon,
      parentGroupUuid: this._parentGroupUuid,
      path: this._path,
      level: this._level,
      sortOrder: this._sortOrder,
      settings: JSON.stringify(this._settings.map((s) => s.toServerDTO())),
      isSystemGroup: this._isSystemGroup,
      isCollapsed: this._isCollapsed,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt.getTime(),
    };
  }

  // ============ 工厂方法 ============

  /**
   * 创建新的设置分组
   */
  public static create(params: {
    name: string;
    description?: string;
    icon?: string;
    parentGroupUuid?: string;
    path: string;
    level: number;
    sortOrder?: number;
    isSystemGroup?: boolean;
  }): SettingGroup {
    const now = Date.now();
    return new SettingGroup({
      uuid: crypto.randomUUID(),
      name: params.name,
      description: params.description,
      icon: params.icon,
      parentGroupUuid: params.parentGroupUuid,
      path: params.path,
      level: params.level,
      sortOrder: params.sortOrder ?? 0,
      settings: [],
      isSystemGroup: params.isSystemGroup ?? false,
      isCollapsed: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  /**
   * 从 ServerDTO 重建
   */
  public static fromServerDTO(dto: SettingGroupServerDTO): SettingGroup {
    return new SettingGroup({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      parentGroupUuid: dto.parentGroupUuid,
      path: dto.path,
      level: dto.level,
      sortOrder: dto.sortOrder,
      settings: dto.settings ? dto.settings.map((s) => SettingItem.fromServerDTO(s)) : [],
      isSystemGroup: dto.isSystemGroup,
      isCollapsed: dto.isCollapsed,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  /**
   * 从 PersistenceDTO 重建
   */
  public static fromPersistenceDTO(dto: SettingGroupPersistenceDTO): SettingGroup {
    const settingsData = JSON.parse(dto.settings);
    return new SettingGroup({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      parentGroupUuid: dto.parentGroupUuid,
      path: dto.path,
      level: dto.level,
      sortOrder: dto.sortOrder,
      settings: Array.isArray(settingsData)
        ? settingsData.map((s) => SettingItem.fromServerDTO(s))
        : [],
      isSystemGroup: dto.isSystemGroup,
      isCollapsed: dto.isCollapsed,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }
}
