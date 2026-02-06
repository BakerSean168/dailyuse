/**
 * ReminderTemplate Aggregate Root - Domain Client
 * 提醒模板聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 ReminderTemplateClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
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

export class ReminderTemplate extends AggregateRoot<ReminderTemplateId> implements ReminderTemplateClient {
  // ================= 1. Backing Fields =================
  private _identityId: IdentityId;
  private _name: string;
  private _description: string | null;
  private _type: ReminderType;
  private _trigger: TriggerConfigClient;
  private _recurrence: RecurrenceConfigClient | null;
  private _activeTime: ActiveTimeConfigClient;
  private _activeHours: ActiveHoursConfigClient | null;
  private _notificationConfig: NotificationConfigClient;
  private _selfEnabled: boolean;
  private _status: ReminderStatus;
  private _effectiveEnabled: boolean;
  private _groupId: ReminderGroupId | null;
  private _importanceLevel: ImportanceLevel;
  private _tags: string[];
  private _color: string | null;
  private _icon: string | null;
  private _nextTriggerAt: Date | null;
  private _stats: ReminderStatsClient;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;
  private _history: ReminderHistory[] | null;

  // UI 扩展
  private _displayTitle: string;
  private _typeText: string;
  private _triggerText: string;
  private _recurrenceText: string | null;
  private _statusText: string;
  private _importanceText: string;
  private _nextTriggerText: string | null;
  private _isActive: boolean;
  private _isPaused: boolean;
  private _lastTriggeredText: string | null;
  private _controlledByGroup: boolean;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
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
  }) {
    super(params.id);
    this._identityId = params.identityId;
    this._name = params.name;
    this._description = params.description;
    this._type = params.type;
    this._trigger = params.trigger;
    this._recurrence = params.recurrence;
    this._activeTime = params.activeTime;
    this._activeHours = params.activeHours;
    this._notificationConfig = params.notificationConfig;
    this._selfEnabled = params.selfEnabled;
    this._status = params.status;
    this._effectiveEnabled = params.effectiveEnabled;
    this._groupId = params.groupId;
    this._importanceLevel = params.importanceLevel;
    this._tags = params.tags;
    this._color = params.color;
    this._icon = params.icon;
    this._nextTriggerAt = params.nextTriggerAt;
    this._stats = params.stats;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
    this._history = params.history;
    this._displayTitle = params.displayTitle;
    this._typeText = params.typeText;
    this._triggerText = params.triggerText;
    this._recurrenceText = params.recurrenceText;
    this._statusText = params.statusText;
    this._importanceText = params.importanceText;
    this._nextTriggerText = params.nextTriggerText;
    this._isActive = params.isActive;
    this._isPaused = params.isPaused;
    this._lastTriggeredText = params.lastTriggeredText;
    this._controlledByGroup = params.controlledByGroup;
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

  get type(): ReminderType {
    return this._type;
  }

  get trigger(): TriggerConfigClient {
    return this._trigger;
  }

  get recurrence(): RecurrenceConfigClient | null {
    return this._recurrence;
  }

  get activeTime(): ActiveTimeConfigClient {
    return this._activeTime;
  }

  get activeHours(): ActiveHoursConfigClient | null {
    return this._activeHours;
  }

  get notificationConfig(): NotificationConfigClient {
    return this._notificationConfig;
  }

  get selfEnabled(): boolean {
    return this._selfEnabled;
  }

  get status(): ReminderStatus {
    return this._status;
  }

  get effectiveEnabled(): boolean {
    return this._effectiveEnabled;
  }

  get groupId(): ReminderGroupId | null {
    return this._groupId;
  }

  get importanceLevel(): ImportanceLevel {
    return this._importanceLevel;
  }

  get tags(): string[] {
    return [...this._tags];
  }

  get color(): string | null {
    return this._color;
  }

  get icon(): string | null {
    return this._icon;
  }

  get nextTriggerAt(): Date | null {
    return this._nextTriggerAt;
  }

  get stats(): ReminderStatsClient {
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

  get history(): ReminderHistoryClient[] | null {
    return this._history ? [...this._history] : null;
  }

  // UI 扩展属性
  get displayTitle(): string {
    return this._displayTitle;
  }

  get typeText(): string {
    return this._typeText;
  }

  get triggerText(): string {
    return this._triggerText;
  }

  get recurrenceText(): string | null {
    return this._recurrenceText;
  }

  get statusText(): string {
    return this._statusText;
  }

  get importanceText(): string {
    return this._importanceText;
  }

  get nextTriggerText(): string | null {
    return this._nextTriggerText;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  get lastTriggeredText(): string | null {
    return this._lastTriggeredText;
  }

  get controlledByGroup(): boolean {
    return this._controlledByGroup;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  // ================= 4. Factory Methods =================
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

  // ================= 5. DTO Conversion =================
  public toDTO(): ReminderTemplateClientDTO {
    return {
      id: String(this.id),
      identityId: String(this._identityId),
      name: this._name,
      description: this._description,
      type: this._type,
      trigger: this._trigger as TriggerConfigClientDTO,
      recurrence: this._recurrence as RecurrenceConfigClientDTO | null,
      activeTime: this._activeTime as ActiveTimeConfigClientDTO,
      activeHours: this._activeHours as ActiveHoursConfigClientDTO | null,
      notificationConfig: this._notificationConfig as NotificationConfigClientDTO,
      selfEnabled: this._selfEnabled,
      status: this._status,
      effectiveEnabled: this._effectiveEnabled,
      groupId: this._groupId ? String(this._groupId) : null,
      importanceLevel: this._importanceLevel,
      tags: [...this._tags],
      color: this._color,
      icon: this._icon,
      nextTriggerAt: this._nextTriggerAt?.getTime() ?? null,
      stats: this._stats as ReminderStatsClientDTO,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      history: this._history ? this._history.map(h => h.toDTO()) : null,
      displayTitle: this._displayTitle,
      typeText: this._typeText,
      triggerText: this._triggerText,
      recurrenceText: this._recurrenceText,
      statusText: this._statusText,
      importanceText: this._importanceText,
      nextTriggerText: this._nextTriggerText,
      isActive: this._isActive,
      isPaused: this._isPaused,
      lastTriggeredText: this._lastTriggeredText,
      controlledByGroup: this._controlledByGroup,
    };
  }
}
