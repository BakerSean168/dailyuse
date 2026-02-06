/**
 * TaskTemplate Aggregate Root - Domain Client
 * 任务模板聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 TaskTemplateClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: TaskTemplateClientDTO): TaskTemplate
 * - Instance toDTO(): TaskTemplateClientDTO
 */

import type {
  TaskTemplateClient,
  TaskTemplateClientDTO,
  TaskTimeConfig,
  TaskTimeConfigDTO,
  RecurrenceRule,
  RecurrenceRuleDTO,
  TaskReminderConfig,
  TaskReminderConfigDTO,
  TaskGoalBinding,
  TaskGoalBindingDTO,
  TaskTemplateStatus,
} from '@dailyuse/contracts/task';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import { AggregateRoot } from '@dailyuse/utils';
import { TaskTemplateId } from '@dailyuse/domain-shared/task';
import { GoalFolderId } from '@dailyuse/domain-shared/goal';
import { IdentityId } from '@dailyuse/domain-shared';

export class TaskTemplate extends AggregateRoot<TaskTemplateId> implements TaskTemplateClient {
  // ================= 1. Backing Fields =================
  private _identityId: IdentityId;
  private _name: string;
  private _description: string | null;
  private _timeConfig: TaskTimeConfig;
  private _recurrenceRule: RecurrenceRule | null;
  private _reminderConfig: TaskReminderConfig | null;
  private _importance: ImportanceLevel;
  private _priority?: number;
  private _goalBinding: TaskGoalBinding | null;
  private _folderId: GoalFolderId | null;
  private _tags: string[];
  private _color: string | null;
  private _status: TaskTemplateStatus;
  private _lastGeneratedDate: Date | null;
  private _generateAheadDays: number | null;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;
  private _parentTaskId: TaskTemplateId | null;
  private _startDate: Date | null;
  private _dueDate: Date | null;
  private _completedAt: Date | null;
  private _estimatedMinutes: number | null;
  private _actualMinutes: number | null;
  private _comment: string | null;
  private _dependencyStatus?: string;
  private _isBlocked?: boolean;
  private _blockingReason: string | null;
  private _instanceCount: number;
  private _completedInstanceCount: number;
  private _pendingInstanceCount: number;
  private _completionRate: number;
  private _history?: any[];
  private _instances?: any[];

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: TaskTemplateId;
    identityId: IdentityId;
    name: string;
    description: string | null;
    timeConfig: TaskTimeConfig;
    recurrenceRule: RecurrenceRule | null;
    reminderConfig: TaskReminderConfig | null;
    importance: ImportanceLevel;
    priority?: number;
    goalBinding: TaskGoalBinding | null;
    folderId: GoalFolderId | null;
    tags: string[];
    color: string | null;
    status: TaskTemplateStatus;
    lastGeneratedDate: Date | null;
    generateAheadDays: number | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    parentTaskId: TaskTemplateId | null;
    startDate: Date | null;
    dueDate: Date | null;
    completedAt: Date | null;
    estimatedMinutes: number | null;
    actualMinutes: number | null;
    comment: string | null;
    dependencyStatus?: string;
    isBlocked?: boolean;
    blockingReason: string | null;
    instanceCount: number;
    completedInstanceCount: number;
    pendingInstanceCount: number;
    completionRate: number;
    history?: any[];
    instances?: any[];
  }) {
    super(params.id);
    this._identityId = params.identityId;
    this._name = params.name;
    this._description = params.description;
    this._timeConfig = params.timeConfig;
    this._recurrenceRule = params.recurrenceRule;
    this._reminderConfig = params.reminderConfig;
    this._importance = params.importance;
    this._priority = params.priority;
    this._goalBinding = params.goalBinding;
    this._folderId = params.folderId;
    this._tags = params.tags;
    this._color = params.color;
    this._status = params.status;
    this._lastGeneratedDate = params.lastGeneratedDate;
    this._generateAheadDays = params.generateAheadDays;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
    this._parentTaskId = params.parentTaskId;
    this._startDate = params.startDate;
    this._dueDate = params.dueDate;
    this._completedAt = params.completedAt;
    this._estimatedMinutes = params.estimatedMinutes;
    this._actualMinutes = params.actualMinutes;
    this._comment = params.comment;
    this._dependencyStatus = params.dependencyStatus;
    this._isBlocked = params.isBlocked;
    this._blockingReason = params.blockingReason;
    this._instanceCount = params.instanceCount;
    this._completedInstanceCount = params.completedInstanceCount;
    this._pendingInstanceCount = params.pendingInstanceCount;
    this._completionRate = params.completionRate;
    this._history = params.history;
    this._instances = params.instances;
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

  get timeConfig(): TaskTimeConfig {
    return this._timeConfig;
  }

  get recurrenceRule(): RecurrenceRule | null {
    return this._recurrenceRule;
  }

  get reminderConfig(): TaskReminderConfig | null {
    return this._reminderConfig;
  }

  get importance(): ImportanceLevel {
    return this._importance;
  }

  get priority(): number | undefined {
    return this._priority;
  }

  get goalBinding(): TaskGoalBinding | null {
    return this._goalBinding;
  }

  get folderId(): GoalFolderId | null {
    return this._folderId;
  }

  get tags(): string[] {
    return [...this._tags];
  }

  get color(): string | null {
    return this._color;
  }

  get status(): TaskTemplateStatus {
    return this._status;
  }

  get lastGeneratedDate(): Date | null {
    return this._lastGeneratedDate;
  }

  get generateAheadDays(): number | null {
    return this._generateAheadDays;
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

  get parentTaskId(): TaskTemplateId | null {
    return this._parentTaskId;
  }

  get startDate(): Date | null {
    return this._startDate;
  }

  get dueDate(): Date | null {
    return this._dueDate;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  get estimatedMinutes(): number | null {
    return this._estimatedMinutes;
  }

  get actualMinutes(): number | null {
    return this._actualMinutes;
  }

  get comment(): string | null {
    return this._comment;
  }

  get dependencyStatus(): string | undefined {
    return this._dependencyStatus;
  }

  get isBlocked(): boolean | undefined {
    return this._isBlocked;
  }

  get blockingReason(): string | null {
    return this._blockingReason;
  }

  get instanceCount(): number {
    return this._instanceCount;
  }

  get completedInstanceCount(): number {
    return this._completedInstanceCount;
  }

  get pendingInstanceCount(): number {
    return this._pendingInstanceCount;
  }

  get completionRate(): number {
    return this._completionRate;
  }

  get history(): any[] | undefined {
    return this._history ? [...this._history] : undefined;
  }

  get instances(): any[] | undefined {
    return this._instances ? [...this._instances] : undefined;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  get isCompleted(): boolean {
    return this._completedAt !== null;
  }

  get isOverdue(): boolean {
    if (!this._dueDate) return false;
    return this._dueDate.getTime() < Date.now() && !this.isCompleted;
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: TaskTemplateClientDTO): TaskTemplate {
    return new TaskTemplate({
      id: TaskTemplateId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      name: dto.name,
      description: dto.description,
      timeConfig: TaskTemplate.parseTimeConfig(dto.timeConfig),
      recurrenceRule: dto.recurrenceRule ? TaskTemplate.parseRecurrenceRule(dto.recurrenceRule) : null,
      reminderConfig: dto.reminderConfig as TaskReminderConfig | null,
      importance: dto.importance,
      priority: dto.priority,
      goalBinding: dto.goalBinding ? TaskTemplate.parseGoalBinding(dto.goalBinding) : null,
      folderId: dto.folderId ? GoalFolderId.of(dto.folderId) : null,
      tags: dto.tags ?? [],
      color: dto.color,
      status: dto.status,
      lastGeneratedDate: dto.lastGeneratedDate ? new Date(dto.lastGeneratedDate) : null,
      generateAheadDays: dto.generateAheadDays,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      parentTaskId: dto.parentTaskId ? TaskTemplateId.of(dto.parentTaskId) : null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
      estimatedMinutes: dto.estimatedMinutes,
      actualMinutes: dto.actualMinutes,
      comment: dto.comment,
      dependencyStatus: dto.dependencyStatus,
      isBlocked: dto.isBlocked,
      blockingReason: dto.blockingReason,
      instanceCount: dto.instanceCount,
      completedInstanceCount: dto.completedInstanceCount,
      pendingInstanceCount: dto.pendingInstanceCount,
      completionRate: dto.completionRate,
      history: dto.history,
      instances: dto.instances,
    });
  }

  private static parseTimeConfig(dto: TaskTimeConfigDTO): TaskTimeConfig {
    return {
      timeType: dto.timeType,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      timePoint: dto.timePoint,
      timeRange: dto.timeRange,
    };
  }

  private static parseRecurrenceRule(dto: RecurrenceRuleDTO): RecurrenceRule {
    return {
      frequency: dto.frequency,
      interval: dto.interval,
      daysOfWeek: dto.daysOfWeek,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      occurrences: dto.occurrences,
    };
  }

  private static parseGoalBinding(dto: TaskGoalBindingDTO): TaskGoalBinding {
    return {
      goalId: dto.goalId as unknown as TaskGoalBinding['goalId'],
      keyResultId: dto.keyResultId as unknown as TaskGoalBinding['keyResultId'],
      goalRecordValue: dto.goalRecordValue,
    };
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): TaskTemplateClientDTO {
    return {
      id: String(this.id) as TaskTemplateClientDTO['id'],
      identityId: String(this._identityId) as TaskTemplateClientDTO['identityId'],
      name: this._name,
      description: this._description,
      timeConfig: this.serializeTimeConfig(this._timeConfig),
      recurrenceRule: this._recurrenceRule ? this.serializeRecurrenceRule(this._recurrenceRule) : null,
      reminderConfig: this._reminderConfig as TaskReminderConfigDTO | null,
      importance: this._importance,
      priority: this._priority,
      goalBinding: this._goalBinding ? this.serializeGoalBinding(this._goalBinding) : null,
      folderId: this._folderId ? String(this._folderId) : null,
      tags: [...this._tags],
      color: this._color,
      status: this._status,
      lastGeneratedDate: this._lastGeneratedDate?.getTime() ?? null,
      generateAheadDays: this._generateAheadDays,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      parentTaskId: this._parentTaskId ? String(this._parentTaskId) : null,
      startDate: this._startDate?.getTime() ?? null,
      dueDate: this._dueDate?.getTime() ?? null,
      completedAt: this._completedAt?.getTime() ?? null,
      estimatedMinutes: this._estimatedMinutes,
      actualMinutes: this._actualMinutes,
      comment: this._comment,
      dependencyStatus: this._dependencyStatus,
      isBlocked: this._isBlocked,
      blockingReason: this._blockingReason,
      instanceCount: this._instanceCount,
      completedInstanceCount: this._completedInstanceCount,
      pendingInstanceCount: this._pendingInstanceCount,
      completionRate: this._completionRate,
      history: this._history ? [...this._history] : undefined,
      instances: this._instances ? [...this._instances] : undefined,
    };
  }

  private serializeTimeConfig(config: TaskTimeConfig): TaskTimeConfigDTO {
    return {
      timeType: config.timeType,
      startDate: config.startDate ? (config.startDate as Date).getTime() : null,
      timePoint: config.timePoint,
      timeRange: config.timeRange,
    };
  }

  private serializeRecurrenceRule(rule: RecurrenceRule): RecurrenceRuleDTO {
    return {
      frequency: rule.frequency,
      interval: rule.interval,
      daysOfWeek: rule.daysOfWeek,
      endDate: rule.endDate ? (rule.endDate as Date).getTime() : null,
      occurrences: rule.occurrences,
    };
  }

  private serializeGoalBinding(binding: TaskGoalBinding): TaskGoalBindingDTO {
    return {
      goalId: String(binding.goalId),
      keyResultId: String(binding.keyResultId),
      goalRecordValue: binding.goalRecordValue,
    };
  }
}
