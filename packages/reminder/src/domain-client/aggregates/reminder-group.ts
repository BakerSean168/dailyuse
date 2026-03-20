/**
 * ReminderGroup Aggregate Root - Domain Client
 * 提醒分组聚合根 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with params object
 * - Public getters via this._props.xxx
 * - Static load(state: ReminderGroupState): ReminderGroup
 * - Instance toDTO(): ReminderGroupClientDTO
 */

import type {
  ReminderGroupClientDTO,
  GroupStatsClientDTO,
  ControlMode,
  ReminderStatus,
} from '@dailyuse/contracts/reminder';
import { AggregateRoot } from '@dailyuse/utils';
import { ReminderGroupId } from '../../domain-shared/value-objects/reminder-group-id';
import { IdentityId } from '@dailyuse/domain-shared';

export interface ReminderGroupState {
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
  effectiveTemplatePolicyText: string;
}

export class ReminderGroup extends AggregateRoot<ReminderGroupId> {
  private readonly _props: ReminderGroupState;

  private constructor(props: ReminderGroupState) {
    super(props.id);
    this._props = props;
  }

  // ================= Getters =================
  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get name(): string {
    return this._props.name;
  }

  get description(): string | null {
    return this._props.description;
  }

  get color(): string | null {
    return this._props.color;
  }

  get icon(): string | null {
    return this._props.icon;
  }

  get controlMode(): ControlMode {
    return this._props.controlMode;
  }

  get enabled(): boolean {
    return this._props.enabled;
  }

  get status(): ReminderStatus {
    return this._props.status;
  }

  get order(): number {
    return this._props.order;
  }

  get stats(): GroupStatsClientDTO {
    return this._props.stats;
  }

  get version(): number {
    return this._props.version;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  // UI 扩展属性
  get displayName(): string {
    return this._props.displayName;
  }

  get controlModeText(): string {
    return this._props.controlModeText;
  }

  get statusText(): string {
    return this._props.statusText;
  }

  get templateCountText(): string {
    return this._props.templateCountText;
  }

  get activeStatusText(): string {
    return this._props.activeStatusText;
  }

  get controlDescription(): string {
    return this._props.controlDescription;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
  }

  // ================= Factory Methods =================
  public static load(state: ReminderGroupState): ReminderGroup {
    return new ReminderGroup(state);
  }

  // ================= DTO Conversion =================
  public toDTO(): ReminderGroupClientDTO {
    return {
      id: String(this._props.id) as ReminderGroupClientDTO['id'],
      identityId: String(this._props.identityId) as ReminderGroupClientDTO['identityId'],
      name: this._props.name,
      description: this._props.description,
      color: this._props.color,
      icon: this._props.icon,
      controlMode: this._props.controlMode,
      enabled: this._props.enabled,
      status: this._props.status,
      order: this._props.order,
      stats: this._props.stats,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      displayName: this._props.displayName,
      controlModeText: this._props.controlModeText,
      statusText: this._props.statusText,
      templateCountText: this._props.templateCountText,
      activeStatusText: this._props.activeStatusText,
      controlDescription: this._props.controlDescription,
      effectiveTemplatePolicyText: this._props.effectiveTemplatePolicyText,
    };
  }
}
