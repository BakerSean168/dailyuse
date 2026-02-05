/**
 * ReminderGroup 聚合根实现
 * 实现 ReminderGroupServer 接口
 */

import {
  ControlMode,
  ReminderStatus,
} from '@dailyuse/contracts/reminder';
import type {
  GroupStatsServer,
  ReminderGroupClientDTO,
  ReminderGroupPersistenceDTO,
  ReminderGroupServer,
  ReminderGroupServerDTO,
} from '@dailyuse/contracts/reminder';
import { AggregateRoot, generateUUID } from '@dailyuse/utils';
import { GroupStats } from '../value-objects';

// IdentityId branded type (从 contracts 内部定义)
type IdentityId = string & { readonly __brand: 'IdentityId' };

export class ReminderGroup extends AggregateRoot<string> implements ReminderGroupServer {
  private _identityId: IdentityId;
  private _name: string;
  private _description: string | null;
  private _controlMode: ControlMode;
  private _enabled: boolean;
  private _status: ReminderStatus;
  private _order: number;
  private _color: string | null;
  private _icon: string | null;
  private _stats: GroupStats;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: number | null;

  private constructor(params: {
    uuid?: string;
    identityId: string;
    name: string;
    description?: string | null;
    controlMode: ControlMode;
    enabled: boolean;
    status: ReminderStatus;
    order: number;
    color?: string | null;
    icon?: string | null;
    stats: GroupStats;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
  }) {
    super(params.uuid || generateUUID());
    this._identityId = params.identityId as IdentityId;
    this._name = params.name;
    this._description = params.description ?? null;
    this._controlMode = params.controlMode;
    this._enabled = params.enabled;
    this._status = params.status;
    this._order = params.order;
    this._color = params.color ?? null;
    this._icon = params.icon ?? null;
    this._stats = params.stats;
    this._createdAt = new Date(params.createdAt);
    this._updatedAt = new Date(params.updatedAt);
    this._deletedAt = params.deletedAt ?? null;
  }

  public get identityId(): IdentityId {
    return this._identityId;
  }
  public get name(): string {
    return this._name;
  }
  public get description(): string | null {
    return this._description;
  }
  public get controlMode(): ControlMode {
    return this._controlMode;
  }
  public get enabled(): boolean {
    return this._enabled;
  }
  public get status(): ReminderStatus {
    return this._status;
  }
  public get order(): number {
    return this._order;
  }
  public get color(): string | null {
    return this._color;
  }
  public get icon(): string | null {
    return this._icon;
  }
  public get stats(): GroupStatsServer {
    return this._stats;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }
  public get updatedAt(): Date {
    return this._updatedAt;
  }
  public get deletedAt(): Date | null {
    return this._deletedAt !== null ? new Date(this._deletedAt) : null;
  }

  public static create(params: {
    identityId: string;
    name: string;
    controlMode?: ControlMode;
    description?: string;
    color?: string;
    icon?: string;
    order?: number;
  }): ReminderGroup {
    const uuid = generateUUID();
    const now = Date.now();
    const stats = GroupStats.createEmpty();
    const group = new ReminderGroup({
      uuid,
      identityId: params.identityId,
      name: params.name,
      description: params.description,
      controlMode: params.controlMode || ControlMode.Individual,
      enabled: true,
      status: ReminderStatus.Active,
      order: params.order || 0,
      color: params.color,
      icon: params.icon,
      stats,
      createdAt: now,
      updatedAt: now,
    });
    group.addDomainEvent('ReminderGroupCreated', {
      identityId: params.identityId,
      group: group.toServerDTO(),
    });
    return group;
  }

  public static fromServerDTO(dto: ReminderGroupServerDTO): ReminderGroup {
    const stats = GroupStats.fromDTO(dto.stats);
    return new ReminderGroup({
      uuid: dto.id,
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      controlMode: dto.controlMode,
      enabled: dto.enabled,
      status: dto.status,
      order: dto.order,
      color: dto.color,
      icon: dto.icon,
      stats,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt ?? null,
    });
  }

  public static fromPersistenceDTO(dto: ReminderGroupPersistenceDTO): ReminderGroup {
    const stats = GroupStats.fromDTO(dto.stats);
    return new ReminderGroup({
      uuid: dto.id,
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      controlMode: dto.controlMode,
      enabled: dto.enabled,
      status: dto.status,
      order: dto.order,
      color: dto.color,
      icon: dto.icon,
      stats,
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
      deletedAt: dto.deletedAt?.getTime() ?? null,
    });
  }

  public switchToGroupControl(): void {
    if (this._controlMode === ControlMode.Group) return;
    const oldMode = this._controlMode;
    this._controlMode = ControlMode.Group;
    this._updatedAt = new Date(Date.now());
    this.addDomainEvent('ReminderGroupControlModeSwitched', {
      identityId: this._identityId,
      groupId: this.id,
      previousMode: oldMode,
      newMode: ControlMode.Group,
    });
  }

  public switchToIndividualControl(): void {
    if (this._controlMode === ControlMode.Individual) return;
    const oldMode = this._controlMode;
    this._controlMode = ControlMode.Individual;
    this._updatedAt = new Date(Date.now());
    this.addDomainEvent('ReminderGroupControlModeSwitched', {
      identityId: this._identityId,
      groupId: this.id,
      previousMode: oldMode,
      newMode: ControlMode.Individual,
    });
  }

  public toggleControlMode(): void {
    if (this._controlMode === ControlMode.Group) {
      this.switchToIndividualControl();
    } else {
      this.switchToGroupControl();
    }
  }

  public enable(): void {
    this._enabled = true;
    this._status = ReminderStatus.Active;
    this._updatedAt = new Date(Date.now());
    this.addDomainEvent('ReminderGroupEnabled', {
      identityId: this._identityId,
      groupId: this.id,
    });
  }

  public pause(): void {
    this._enabled = false;
    this._status = ReminderStatus.Paused;
    this._updatedAt = new Date(Date.now());
    this.addDomainEvent('ReminderGroupPaused', {
      identityId: this._identityId,
      groupId: this.id,
    });
  }

  public toggle(): void {
    if (this._enabled) {
      this.pause();
    } else {
      this.enable();
    }
  }

  public async enableAllTemplates(): Promise<void> {
    if (this._controlMode !== ControlMode.Group) {
      throw new Error('只能在 GROUP 模式下批量启用模板');
    }
    this._enabled = true;
    this._updatedAt = new Date(Date.now());
  }

  public async pauseAllTemplates(): Promise<void> {
    if (this._controlMode !== ControlMode.Group) {
      throw new Error('只能在 GROUP 模式下批量暂停模板');
    }
    this._enabled = false;
    this._updatedAt = new Date(Date.now());
  }

  public async enableGroupAndAllTemplates(): Promise<void> {
    this.enable();
    await this.enableAllTemplates();
  }

  public async pauseGroupAndAllTemplates(): Promise<void> {
    this.pause();
    await this.pauseAllTemplates();
  }

  public async updateStats(): Promise<void> {
    this._updatedAt = new Date(Date.now());
  }

  public async getTemplatesCount(): Promise<number> {
    return this._stats.totalTemplates;
  }

  public async getActiveTemplatesCount(): Promise<number> {
    return this._stats.activeTemplates;
  }

  public activate(): void {
    this._status = ReminderStatus.Active;
    this._deletedAt = null;
    this._updatedAt = new Date(Date.now());
  }

  public softDelete(): void {
    this._deletedAt = Date.now();
    this._status = ReminderStatus.Paused;
    this._updatedAt = new Date(Date.now());
    this.addDomainEvent('ReminderGroupDeleted', {
      identityId: this._identityId,
      groupId: this.id,
      groupName: this._name,
    });
  }

  public restore(): void {
    this._deletedAt = null;
    this._status = ReminderStatus.Active;
    this._updatedAt = new Date(Date.now());
  }

  public toServerDTO(): ReminderGroupServerDTO {
    return {
      id: this.id,
      identityId: this.identityId,
      name: this.name,
      description: this.description,
      controlMode: this.controlMode,
      enabled: this.enabled,
      status: this.status,
      order: this.order,
      color: this.color,
      icon: this.icon,
      stats: this._stats.toServerDTO(),
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
      deletedAt: this.deletedAt?.getTime() ?? null,
    };
  }

  public toClientDTO(): ReminderGroupClientDTO {
    const controlModeText =
      this.controlMode === ControlMode.Group ? '组控制' : '个体控制';
    const statusText = this.status === ReminderStatus.Active ? '活跃' : '暂停';
    const controlDescription =
      this.controlMode === ControlMode.Group
        ? '所有提醒统一启用'
        : '提醒独立控制';

    const statsDTO = this._stats.toServerDTO();

    return {
      id: this.id,
      identityId: this.identityId,
      name: this.name,
      description: this.description,
      controlMode: this.controlMode,
      enabled: this.enabled,
      status: this.status,
      order: this.order,
      color: this.color,
      icon: this.icon,
      stats: {
        ...statsDTO,
        templateCountText: `${statsDTO.totalTemplates} 个提醒`,
        activeStatusText: `${statsDTO.activeTemplates} 个活跃`,
      },
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
      deletedAt: this.deletedAt?.getTime() ?? null,

      // UI 扩展
      displayName: this.name,
      controlModeText,
      statusText,
      templateCountText: `${this._stats.totalTemplates} 个提醒`,
      activeStatusText: `${this._stats.activeTemplates} 个活跃`,
      controlDescription,
    };
  }

  public toPersistenceDTO(): ReminderGroupPersistenceDTO {
    return {
      id: this.id,
      identityId: this.identityId,
      name: this.name,
      description: this.description,
      controlMode: this.controlMode,
      enabled: this.enabled,
      status: this.status,
      order: this.order,
      color: this.color,
      icon: this.icon,
      stats: this._stats.toServerDTO(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
