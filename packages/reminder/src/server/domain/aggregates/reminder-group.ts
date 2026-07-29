/**
 * ReminderGroup 聚合根实现
 */

import { ControlMode, ReminderStatus } from '@memoflow/contracts/reminder';
import type {
  IGroupStats,
  ReminderEventMap,
  ReminderGroupClientDTO,
  ReminderGroupServerDTO,
} from '@memoflow/contracts/reminder';
import type { ReminderGroupId } from '@memoflow/contracts/primitives';
import { AggregateRoot } from '@memoflow/utils/domain';
import { generateUUID } from '@memoflow/utils/shared';
import { IdentityId } from '@memoflow/domain-shared';
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
  deletedAt: Date | null;
  version: number;
}

export class ReminderGroup extends AggregateRoot<string> {
  private _props: ReminderGroupState;

  private constructor(state: ReminderGroupState) {
    super(state.id);
    this._props = state;
  }

  public get identityId(): IdentityId {
    return this._props.identityId;
  }
  public get name(): string {
    return this._props.name;
  }
  public get description(): string | null {
    return this._props.description;
  }
  public get controlMode(): ControlMode {
    return this._props.controlMode;
  }
  public get enabled(): boolean {
    return this._props.enabled;
  }
  public get status(): ReminderStatus {
    return this._props.status;
  }
  public get order(): number {
    return this._props.order;
  }
  public get color(): string | null {
    return this._props.color;
  }
  public get icon(): string | null {
    return this._props.icon;
  }
  public get stats(): IGroupStats {
    return this._props.stats;
  }
  public get createdAt(): Date {
    return this._props.createdAt;
  }
  public get updatedAt(): Date {
    return this._props.updatedAt;
  }
  public get deletedAt(): Date | null {
    return this._props.deletedAt;
  }
  public get version(): number {
    return this._props.version;
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
    group.addDomainEvent<ReminderEventMap['reminder:group-created']>('reminder:group-created', {
      identityId: params.identityId as IdentityId,
      group: group.toServerDTO(),
    });
    return group;
  }

  public switchToGroupControl(): void {
    if (this._props.controlMode === ControlMode.Group) return;
    const oldMode = this._props.controlMode;
    this._props.controlMode = ControlMode.Group;
    this._props.updatedAt = new Date();
    this.addDomainEvent<ReminderEventMap['reminder:group-control-mode-switched']>('reminder:group-control-mode-switched', {
      identityId: this._props.identityId,
      groupId: this.id as ReminderGroupId,
      previousMode: oldMode,
      newMode: ControlMode.Group,
    });
  }

  public switchToIndividualControl(): void {
    if (this._props.controlMode === ControlMode.Individual) return;
    const oldMode = this._props.controlMode;
    this._props.controlMode = ControlMode.Individual;
    this._props.updatedAt = new Date();
    this.addDomainEvent<ReminderEventMap['reminder:group-control-mode-switched']>('reminder:group-control-mode-switched', {
      identityId: this._props.identityId,
      groupId: this.id as ReminderGroupId,
      previousMode: oldMode,
      newMode: ControlMode.Individual,
    });
  }

  public toggleControlMode(): void {
    if (this._props.controlMode === ControlMode.Group) {
      this.switchToIndividualControl();
    } else {
      this.switchToGroupControl();
    }
  }

  public enable(): void {
    this._props.enabled = true;
    this._props.status = ReminderStatus.Active;
    this._props.updatedAt = new Date();
    this.addDomainEvent<ReminderEventMap['reminder:group-enabled']>('reminder:group-enabled', {
      identityId: this._props.identityId,
      groupId: this.id as ReminderGroupId,
    });
  }

  public pause(): void {
    this._props.enabled = false;
    this._props.status = ReminderStatus.Paused;
    this._props.updatedAt = new Date();
    this.addDomainEvent<ReminderEventMap['reminder:group-paused']>('reminder:group-paused', {
      identityId: this._props.identityId,
      groupId: this.id as ReminderGroupId,
    });
  }

  public toggle(): void {
    if (this._props.enabled) {
      this.pause();
    } else {
      this.enable();
    }
  }

  public enableAllTemplates(): void {
    if (this._props.controlMode !== ControlMode.Group) {
      throw new Error('只能在 GROUP 模式下批量启用模板');
    }
    this._props.enabled = true;
    this._props.updatedAt = new Date();
  }

  public pauseAllTemplates(): void {
    if (this._props.controlMode !== ControlMode.Group) {
      throw new Error('只能在 GROUP 模式下批量暂停模板');
    }
    this._props.enabled = false;
    this._props.updatedAt = new Date();
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
    this._props.stats = stats;
    this._props.updatedAt = new Date();
  }

  public getTemplatesCount(): number {
    return this._props.stats.totalTemplates;
  }

  public getActiveTemplatesCount(): number {
    return this._props.stats.activeTemplates;
  }

  public activate(): void {
    this._props.status = ReminderStatus.Active;
    this._props.deletedAt = null;
    this._props.updatedAt = new Date();
  }

  public softDelete(): void {
    this._props.deletedAt = new Date();
    this._props.status = ReminderStatus.Paused;
    this._props.updatedAt = new Date();
    this.addDomainEvent<ReminderEventMap['reminder:group-deleted']>('reminder:group-deleted', {
      identityId: this._props.identityId,
      groupId: this.id,
      groupName: this._props.name,
    });
  }

  public restore(): void {
    this._props.deletedAt = null;
    this._props.status = ReminderStatus.Active;
    this._props.updatedAt = new Date();
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
      stats: this._props.stats.toDTO(),
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
        ...this._props.stats.toDTO(),
      },
      version: this.version,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
      deletedAt: this.deletedAt?.getTime() ?? null,
    };
  }
}
