/**
 * ReminderGroup 聚合根实现
 */

import { ControlMode, ReminderStatus } from '@dailyuse/contracts/reminder';
import type {
  IGroupStats,
  ReminderEventMap,
  ReminderGroupClientDTO,
  ReminderGroupServerDTO,
} from '@dailyuse/contracts/reminder';
import type { ReminderGroupId } from '@dailyuse/contracts/primitives';
import { AggregateRoot, generateUUID } from '@dailyuse/utils';
import { IdentityId } from '@dailyuse/domain-shared';
import { GroupStats } from '../value-objects';

/**
 * ReminderGroup 内部状态接口
 */
export interface ReminderGroupState {
  id: string;
  identityId: IdentityId;
  name: string;
  description: string | null;
  controlMode: ControlMode;
  enabled: boolean;
  status: ReminderStatus;
  order: number;
  color: string | null;
  icon: string | null;
  stats: GroupStats;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: number | null;
  version: number;
}

export class ReminderGroup extends AggregateRoot<string> {
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
  private _version: number;

  private constructor(state: ReminderGroupState) {
    super(state.id);
    this._identityId = state.identityId;
    this._name = state.name;
    this._description = state.description;
    this._controlMode = state.controlMode;
    this._enabled = state.enabled;
    this._status = state.status;
    this._order = state.order;
    this._color = state.color;
    this._icon = state.icon;
    this._stats = state.stats;
    this._createdAt = state.createdAt;
    this._updatedAt = state.updatedAt;
    this._deletedAt = state.deletedAt;
    this._version = state.version;
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
  public get stats(): IGroupStats {
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
  public get version(): number {
    return this._version;
  }

  public static load(state: ReminderGroupState): ReminderGroup {
    return new ReminderGroup(state);
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
    const newId = generateUUID();
    const now = new Date();
    const stats = GroupStats.createEmpty();
    const group = new ReminderGroup({
      id: newId,
      identityId: params.identityId as IdentityId,
      name: params.name,
      description: params.description ?? null,
      controlMode: params.controlMode || ControlMode.Individual,
      enabled: true,
      status: ReminderStatus.Active,
      order: params.order || 0,
      color: params.color ?? null,
      icon: params.icon ?? null,
      stats,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
    group.addDomainEvent<ReminderEventMap['reminder:group:created']>('reminder:group:created', {
      identityId: params.identityId as IdentityId,
      group: group.toServerDTO(),
    });
    return group;
  }

  public switchToGroupControl(): void {
    if (this._controlMode === ControlMode.Group) return;
    const oldMode = this._controlMode;
    this._controlMode = ControlMode.Group;
    this._updatedAt = new Date(Date.now());
    this.addDomainEvent<ReminderEventMap['reminder:group:control-mode-switched']>('reminder:group:control-mode-switched', {
      identityId: this._identityId,
      groupId: this.id as ReminderGroupId,
      previousMode: oldMode,
      newMode: ControlMode.Group,
    });
  }

  public switchToIndividualControl(): void {
    if (this._controlMode === ControlMode.Individual) return;
    const oldMode = this._controlMode;
    this._controlMode = ControlMode.Individual;
    this._updatedAt = new Date(Date.now());
    this.addDomainEvent<ReminderEventMap['reminder:group:control-mode-switched']>('reminder:group:control-mode-switched', {
      identityId: this._identityId,
      groupId: this.id as ReminderGroupId,
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
    this.addDomainEvent<ReminderEventMap['reminder:group:enabled']>('reminder:group:enabled', {
      identityId: this._identityId,
      groupId: this.id as ReminderGroupId,
    });
  }

  public pause(): void {
    this._enabled = false;
    this._status = ReminderStatus.Paused;
    this._updatedAt = new Date(Date.now());
    this.addDomainEvent<ReminderEventMap['reminder:group:paused']>('reminder:group:paused', {
      identityId: this._identityId,
      groupId: this.id as ReminderGroupId,
    });
  }

  public toggle(): void {
    if (this._enabled) {
      this.pause();
    } else {
      this.enable();
    }
  }

  public enableAllTemplates(): void {
    if (this._controlMode !== ControlMode.Group) {
      throw new Error('只能在 GROUP 模式下批量启用模板');
    }
    this._enabled = true;
    this._updatedAt = new Date(Date.now());
  }

  public pauseAllTemplates(): void {
    if (this._controlMode !== ControlMode.Group) {
      throw new Error('只能在 GROUP 模式下批量暂停模板');
    }
    this._enabled = false;
    this._updatedAt = new Date(Date.now());
  }

  public enableGroupAndAllTemplates(): void {
    this.enable();
    this.enableAllTemplates();
  }

  public pauseGroupAndAllTemplates(): void {
    this.pause();
    this.pauseAllTemplates();
  }

  public updateStats(stats: GroupStats): void {
    this._stats = stats;
    this._updatedAt = new Date(Date.now());
  }

  public getTemplatesCount(): number {
    return this._stats.totalTemplates;
  }

  public getActiveTemplatesCount(): number {
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
    this.addDomainEvent<ReminderEventMap['reminder:group:deleted']>('reminder:group:deleted', {
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
      id: this.id as ReminderGroupId,
      identityId: this.identityId,
      name: this.name,
      description: this.description,
      controlMode: this.controlMode,
      enabled: this.enabled,
      status: this.status,
      order: this.order,
      color: this.color,
      icon: this.icon,
      stats: this._stats.toDTO(),
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
      deletedAt: this.deletedAt?.getTime() ?? null,
      version: this.version,
    };
  }

  public toClientDTO(): ReminderGroupClientDTO {
    return {
      id: this.id as ReminderGroupClientDTO['id'],
      identityId: this.identityId as ReminderGroupClientDTO['identityId'],
      name: this.name,
      description: this.description,
      controlMode: this.controlMode,
      enabled: this.enabled,
      status: this.status,
      order: this.order,
      color: this.color,
      icon: this.icon,
      stats: {
        ...this._stats.toDTO(),
      },
      version: this.version,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
      deletedAt: this.deletedAt?.getTime() ?? null,
    };
  }
}
