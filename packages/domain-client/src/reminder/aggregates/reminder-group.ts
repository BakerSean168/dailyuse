/**
 * ReminderGroup Aggregate Root - Domain Client
 * 提醒分组聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 ReminderGroupClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: ReminderGroupClientDTO): ReminderGroup
 * - Instance toDTO(): ReminderGroupClientDTO
 */

import type {
  ReminderGroupClient,
  ReminderGroupClientDTO,
  GroupStatsClientDTO,
  ControlMode,
  ReminderStatus,
} from '@dailyuse/contracts/reminder';
import { AggregateRoot } from '@dailyuse/utils';
import { ReminderGroupId } from '@dailyuse/domain-shared/reminder';
import { IdentityId } from '@dailyuse/domain-shared';

export class ReminderGroup extends AggregateRoot<ReminderGroupId> implements ReminderGroupClient {
  // ================= 1. Backing Fields =================
  private _identityId: IdentityId;
  private _name: string;
  private _description: string | null;
  private _color: string | null;
  private _icon: string | null;
  private _controlMode: ControlMode;
  private _enabled: boolean;
  private _status: ReminderStatus;
  private _order: number;
  private _stats: GroupStatsClientDTO;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // UI 扩展
  private _displayName: string;
  private _controlModeText: string;
  private _statusText: string;
  private _templateCountText: string;
  private _activeStatusText: string;
  private _controlDescription: string;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: ReminderGroupId;
    identityId: IdentityId;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    controlMode: ControlMode;
    enabled: boolean;
    status: ReminderStatus;
    order: number;
    stats: GroupStatsClientDTO;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    displayName: string;
    controlModeText: string;
    statusText: string;
    templateCountText: string;
    activeStatusText: string;
    controlDescription: string;
  }) {
    super(params.id);
    this._identityId = params.identityId;
    this._name = params.name;
    this._description = params.description;
    this._color = params.color;
    this._icon = params.icon;
    this._controlMode = params.controlMode;
    this._enabled = params.enabled;
    this._status = params.status;
    this._order = params.order;
    this._stats = params.stats;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
    this._displayName = params.displayName;
    this._controlModeText = params.controlModeText;
    this._statusText = params.statusText;
    this._templateCountText = params.templateCountText;
    this._activeStatusText = params.activeStatusText;
    this._controlDescription = params.controlDescription;
  }

  // ================= 3. Getters =================
  get identityId(): IdentityId {
    return this._identityId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get color(): string | null {
    return this._color;
  }

  get icon(): string | null {
    return this._icon;
  }

  get controlMode(): ControlMode {
    return this._controlMode;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get status(): ReminderStatus {
    return this._status;
  }

  get order(): number {
    return this._order;
  }

  get stats(): GroupStatsClientDTO {
    return this._stats;
  }

  get version(): number {
    return this._version;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // UI 扩展属性
  get displayName(): string {
    return this._displayName;
  }

  get controlModeText(): string {
    return this._controlModeText;
  }

  get statusText(): string {
    return this._statusText;
  }

  get templateCountText(): string {
    return this._templateCountText;
  }

  get activeStatusText(): string {
    return this._activeStatusText;
  }

  get controlDescription(): string {
    return this._controlDescription;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: ReminderGroupClientDTO): ReminderGroup {
    return new ReminderGroup({
      id: ReminderGroupId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      name: dto.name,
      description: dto.description,
      color: dto.color,
      icon: dto.icon,
      controlMode: dto.controlMode,
      enabled: dto.enabled,
      status: dto.status,
      order: dto.order,
      stats: dto.stats,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      displayName: dto.displayName,
      controlModeText: dto.controlModeText,
      statusText: dto.statusText,
      templateCountText: dto.templateCountText,
      activeStatusText: dto.activeStatusText,
      controlDescription: dto.controlDescription,
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): ReminderGroupClientDTO {
    return {
      id: String(this.id),
      identityId: String(this._identityId),
      name: this._name,
      description: this._description,
      color: this._color,
      icon: this._icon,
      controlMode: this._controlMode,
      enabled: this._enabled,
      status: this._status,
      order: this._order,
      stats: this._stats,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      displayName: this._displayName,
      controlModeText: this._controlModeText,
      statusText: this._statusText,
      templateCountText: this._templateCountText,
      activeStatusText: this._activeStatusText,
      controlDescription: this._controlDescription,
    };
  }
}
