/**
 * ReminderTemplate Aggregate Root - Domain Client
 * 提醒模板聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 ReminderTemplateClient 接口
 * - Private constructor with props object
 * - Public getters via this._props.xxx
 * - Static fromDTO(dto: ReminderTemplateClientDTO): ReminderTemplate
 * - Instance toDTO(): ReminderTemplateClientDTO
 */

import type {
  ReminderTemplateClient,
  ReminderTemplateClientDTO,
  TriggerConfigClientDTO,
  TriggerConfigClient,
  RecurrenceConfigClientDTO,
  RecurrenceConfigClient,
  ActiveTimeConfigClientDTO,
  ActiveTimeConfigClient,
  ActiveHoursConfigClientDTO,
  ActiveHoursConfigClient,
  NotificationConfigClientDTO,
  NotificationConfigClient,
  ReminderStatsClientDTO,
  ReminderStatsClient,
  ReminderHistoryClientDTO,
  ReminderHistoryClient,
  ReminderType,
  ReminderStatus,
} from '@dailyuse/contracts/reminder';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import { AggregateRoot } from '@dailyuse/utils';
import { ReminderTemplateId, ReminderGroupId } from '@dailyuse/domain-shared/reminder';
import { IdentityId } from '@dailyuse/domain-shared';
import { ReminderHistory } from '../entities/reminder-history.js';

// 内部状态接口
interface ReminderTemplateState {
  id: ReminderTemplateId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  type: ReminderType;
  trigger: TriggerConfigClient;
  recurrence: RecurrenceConfigClient | null;
  activeTime: ActiveTimeConfigClient;
  activeHours: ActiveHoursConfigClient | null;
  notificationConfig: NotificationConfigClient;
  selfEnabled: boolean;
  status: ReminderStatus;
  effectiveEnabled: boolean;
  groupId: ReminderGroupId | null;
  importanceLevel: ImportanceLevel;
  tags: string[];
  color: string | null;
  icon: string | null;
  nextTriggerAt: Date | null;
  stats: ReminderStatsClient;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  history: ReminderHistory[] | null;
  displayTitle: string;
  typeText: string;
  triggerText: string;
  recurrenceText: string | null;
  statusText: string;
  importanceText: string;
  nextTriggerText: string | null;
  isActive: boolean;
  isPaused: boolean;
  lastTriggeredText: string | null;
  controlledByGroup: boolean;
}

export class ReminderTemplate extends AggregateRoot<ReminderTemplateId> implements ReminderTemplateClient {
  private readonly _props: ReminderTemplateState;

  private constructor(props: ReminderTemplateState) {
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

  get type(): ReminderType {
    return this._props.type;
  }

  get trigger(): TriggerConfigClient {
    return this._props.trigger;
  }

  get recurrence(): RecurrenceConfigClient | null {
    return this._props.recurrence;
  }

  get activeTime(): ActiveTimeConfigClient {
    return this._props.activeTime;
  }

  get activeHours(): ActiveHoursConfigClient | null {
    return this._props.activeHours;
  }

  get notificationConfig(): NotificationConfigClient {
    return this._props.notificationConfig;
  }

  get selfEnabled(): boolean {
    return this._props.selfEnabled;
  }

  get status(): ReminderStatus {
    return this._props.status;
  }

  get effectiveEnabled(): boolean {
    return this._props.effectiveEnabled;
  }

  get groupId(): ReminderGroupId | null {
    return this._props.groupId;
  }

  get importanceLevel(): ImportanceLevel {
    return this._props.importanceLevel;
  }

  get tags(): string[] {
    return [...this._props.tags];
  }

  get color(): string | null {
    return this._props.color;
  }

  get icon(): string | null {
    return this._props.icon;
  }

  get nextTriggerAt(): Date | null {
    return this._props.nextTriggerAt;
  }

  get stats(): ReminderStatsClient {
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

  get history(): ReminderHistoryClient[] | null {
    return this._props.history ? [...this._props.history] : null;
  }

  // UI 扩展属性
  get displayTitle(): string {
    return this._props.displayTitle;
  }

  get typeText(): string {
    return this._props.typeText;
  }

  get triggerText(): string {
    return this._props.triggerText;
  }

  get recurrenceText(): string | null {
    return this._props.recurrenceText;
  }

  get statusText(): string {
    return this._props.statusText;
  }

  get importanceText(): string {
    return this._props.importanceText;
  }

  get nextTriggerText(): string | null {
    return this._props.nextTriggerText;
  }

  get isActive(): boolean {
    return this._props.isActive;
  }

  get isPaused(): boolean {
    return this._props.isPaused;
  }

  get lastTriggeredText(): string | null {
    return this._props.lastTriggeredText;
  }

  get controlledByGroup(): boolean {
    return this._props.controlledByGroup;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
  }

  // ================= Factory Methods =================
  public static fromDTO(dto: ReminderTemplateClientDTO): ReminderTemplate {
    return new ReminderTemplate({
      id: ReminderTemplateId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      name: dto.name,
      description: dto.description,
      type: dto.type,
      trigger: dto.trigger as TriggerConfigClient,
      recurrence: dto.recurrence as RecurrenceConfigClient | null,
      activeTime: dto.activeTime as ActiveTimeConfigClient,
      activeHours: dto.activeHours as ActiveHoursConfigClient | null,
      notificationConfig: dto.notificationConfig as NotificationConfigClient,
      selfEnabled: dto.selfEnabled,
      status: dto.status,
      effectiveEnabled: dto.effectiveEnabled,
      groupId: dto.groupId ? ReminderGroupId.of(dto.groupId) : null,
      importanceLevel: dto.importanceLevel,
      tags: dto.tags ?? [],
      color: dto.color,
      icon: dto.icon,
      nextTriggerAt: dto.nextTriggerAt ? new Date(dto.nextTriggerAt) : null,
      stats: dto.stats as ReminderStatsClient,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      history: dto.history ? dto.history.map(h => ReminderHistory.fromDTO(h)) : null,
      displayTitle: dto.displayTitle,
      typeText: dto.typeText,
      triggerText: dto.triggerText,
      recurrenceText: dto.recurrenceText,
      statusText: dto.statusText,
      importanceText: dto.importanceText,
      nextTriggerText: dto.nextTriggerText,
      isActive: dto.isActive,
      isPaused: dto.isPaused,
      lastTriggeredText: dto.lastTriggeredText,
      controlledByGroup: dto.controlledByGroup,
    });
  }

  // ================= DTO Conversion =================
  public toDTO(): ReminderTemplateClientDTO {
    return {
      id: String(this._props.id),
      identityId: String(this._props.identityId),
      name: this._props.name,
      description: this._props.description,
      type: this._props.type,
      trigger: this._props.trigger as TriggerConfigClientDTO,
      recurrence: this._props.recurrence as RecurrenceConfigClientDTO | null,
      activeTime: this._props.activeTime as ActiveTimeConfigClientDTO,
      activeHours: this._props.activeHours as ActiveHoursConfigClientDTO | null,
      notificationConfig: this._props.notificationConfig as NotificationConfigClientDTO,
      selfEnabled: this._props.selfEnabled,
      status: this._props.status,
      effectiveEnabled: this._props.effectiveEnabled,
      groupId: this._props.groupId ? String(this._props.groupId) : null,
      importanceLevel: this._props.importanceLevel,
      tags: [...this._props.tags],
      color: this._props.color,
      icon: this._props.icon,
      nextTriggerAt: this._props.nextTriggerAt?.getTime() ?? null,
      stats: this._props.stats as ReminderStatsClientDTO,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      history: this._props.history ? this._props.history.map(h => h.toDTO()) : null,
      displayTitle: this._props.displayTitle,
      typeText: this._props.typeText,
      triggerText: this._props.triggerText,
      recurrenceText: this._props.recurrenceText,
      statusText: this._props.statusText,
      importanceText: this._props.importanceText,
      nextTriggerText: this._props.nextTriggerText,
      isActive: this._props.isActive,
      isPaused: this._props.isPaused,
      lastTriggeredText: this._props.lastTriggeredText,
      controlledByGroup: this._props.controlledByGroup,
    };
  }
}
