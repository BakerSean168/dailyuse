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
import { AggregateRoot } from '@dailyuse/utils';
import { GroupStats } from '../value-objects';

export class ReminderGroup extends AggregateRoot implements ReminderGroupServer {
  private _accountUuid: string;
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
    accountUuid: string;
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
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
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

  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
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
    accountUuid: string;
    name: string;
    controlMode?: ControlMode;
    description?: string;
    color?: string;
    icon?: string;
    order?: number;
  }): ReminderGroup {
    const uuid = AggregateRoot.generateUUID();
    const now = Date.now();
    const stats = new GroupStats({
      totalTemplates: 0,
      activeTemplates: 0,
      pausedTemplates: 0,
      selfEnabledTemplates: 0,
      selfPausedTemplates: 0,
    });
    const group = new ReminderGroup({
      uuid,
      accountUuid: params.accountUuid,
      name: params.name,
      description: params.description,
      controlMode: params.controlMode || ControlMode.INDIVIDUAL,
      enabled: true,
      status: ReminderStatus.ACTIVE,
      order: params.order || 0,
      color: params.color,
      icon: params.icon,
      stats,
      createdAt: now,
      updatedAt: now,
    });
    group.addDomainEvent({
      eventType: 'ReminderGroupCreated',
      aggregateId: uuid,
      occurredOn: new Date(),
      accountUuid: params.accountUuid,
      payload: { group: group.toServerDTO() },
    });
    return group;
  }

  public static fromServerDTO(dto: ReminderGroupServerDTO): ReminderGroup {
    const stats = GroupStats.fromServerDTO(dto.stats);
    return new ReminderGroup({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
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
    const stats = GroupStats.fromServerDTO(JSON.parse(dto.stats));
    return new ReminderGroup({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
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
    if (this._controlMode === ControlMode.GROUP) return;
    const oldMode = this._controlMode;
    this._controlMode = ControlMode.GROUP;
    this._updatedAt = new Date(Date.now());
    this.addDomainEvent({
      eventType: 'ReminderGroupControlModeSwitched',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        groupUuid: this.uuid,
        previousMode: oldMode,
        newMode: ControlMode.GROUP,
      },
    });
  }

  public switchToIndividualControl(): void {
    if (this._controlMode === ControlMode.INDIVIDUAL) return;
    const oldMode = this._controlMode;
    this._controlMode = ControlMode.INDIVIDUAL;
    this._updatedAt = new Date(Date.now());
    this.addDomainEvent({
      eventType: 'ReminderGroupControlModeSwitched',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        groupUuid: this.uuid,
        previousMode: oldMode,
        newMode: ControlMode.INDIVIDUAL,
      },
    });
  }

  public toggleControlMode(): void {
    if (this._controlMode === ControlMode.GROUP) {
      this.switchToIndividualControl();
    } else {
      this.switchToGroupControl();
    }
  }

  public enable(): void {
    this._enabled = true;
    this._status = ReminderStatus.ACTIVE;
    this._updatedAt = new Date(Date.now());
    this.addDomainEvent({
      eventType: 'ReminderGroupEnabled',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: { groupUuid: this.uuid },
    });
  }

  public pause(): void {
    this._enabled = false;
    this._status = ReminderStatus.PAUSED;
    this._updatedAt = new Date(Date.now());
    this.addDomainEvent({
      eventType: 'ReminderGroupPaused',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: { groupUuid: this.uuid },
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
    if (this._controlMode !== ControlMode.GROUP) {
      throw new Error('只能在 GROUP 模式下批量启用模板');
    }
    this._enabled = true;
    this._updatedAt = new Date(Date.now());
  }

  public async pauseAllTemplates(): Promise<void> {
    if (this._controlMode !== ControlMode.GROUP) {
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
    this._status = ReminderStatus.ACTIVE;
    this._deletedAt = null;
    this._updatedAt = new Date(Date.now());
  }

  public softDelete(): void {
    this._deletedAt = Date.now();
    this._status = ReminderStatus.PAUSED;
    this._updatedAt = new Date(Date.now());
    this.addDomainEvent({
      eventType: 'ReminderGroupDeleted',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: { groupUuid: this.uuid, groupName: this._name },
    });
  }

  public restore(): void {
    this._deletedAt = null;
    this._status = ReminderStatus.ACTIVE;
    this._updatedAt = new Date(Date.now());
  }

  public toServerDTO(): ReminderGroupServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this.name,
      description: this.description,
      controlMode: this.controlMode,
      enabled: this.enabled,
      status: this.status,
      order: this.order,
      color: this.color,
      icon: this.icon,
      stats: this.stats,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
      deletedAt: this.deletedAt?.getTime() ?? null,
    };
  }

  public toClientDTO(): ReminderGroupClientDTO {
    const controlModeText =
      this.controlMode === ControlMode.GROUP ? '组控制' : '个体控制';
    const statusText = this.status === ReminderStatus.ACTIVE ? '活跃' : '暂停';
    const controlDescription =
      this.controlMode === ControlMode.GROUP
        ? '所有提醒统一启用'
        : '提醒独立控制';

    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this.name,
      description: this.description,
      controlMode: this.controlMode,
      enabled: this.enabled,
      status: this.status,
      order: this.order,
      color: this.color,
      icon: this.icon,
      stats: this._stats.toClientDTO(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,

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
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this.name,
      description: this.description,
      controlMode: this.controlMode,
      enabled: this.enabled,
      status: this.status,
      order: this.order,
      color: this.color,
      icon: this.icon,
      stats: JSON.stringify(this.stats),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
