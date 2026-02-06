/**
 * Goal Aggregate Root - Domain Client
 * 目标聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 GoalClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: GoalClientDTO): Goal
 * - Instance toDTO(): GoalClientDTO
 */

import type {
  GoalClient,
  GoalClientDTO,
  GoalReminderConfig,
  GoalReminderConfigDTO,
  KeyResultClientDTO,
  GoalReviewClientDTO,
  GoalTimeRangeSummary,
} from '@dailyuse/contracts/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import { AggregateRoot } from '@dailyuse/utils';
import { GoalId, GoalFolderId } from '@dailyuse/domain-shared/goal';
import { IdentityId } from '@dailyuse/domain-shared/shared';

export class Goal extends AggregateRoot<GoalId> implements GoalClient {
  // ================= 1. Backing Fields =================
  private _identityId: IdentityId;
  private _name: string;
  private _description: string | null;
  private _color: string | null;
  private _feasibilityAnalysis: string | null;
  private _motivation: string | null;
  private _status: GoalStatus;
  private _importance: ImportanceLevel;
  private _priority: number;
  private _category: string | null;
  private _tags: string[];
  private _startDate: Date | null;
  private _targetDate: Date | null;
  private _completedAt: Date | null;
  private _archivedAt: Date | null;
  private _folderId: GoalFolderId | null;
  private _parentGoalId: GoalId | null;
  private _sortOrder: number;
  private _reminderConfig: GoalReminderConfigDTO | null;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;
  private _keyResults: KeyResultClientDTO[] | null;
  private _reviews: GoalReviewClientDTO[] | null;

  // UI 计算字段
  private _progress: number;
  private _isOverdue: boolean;
  private _daysRemaining: number | null;
  private _timeRangeSummary: GoalTimeRangeSummary | null;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: GoalId;
    identityId: IdentityId;
    name: string;
    description: string | null;
    color: string | null;
    feasibilityAnalysis: string | null;
    motivation: string | null;
    status: GoalStatus;
    importance: ImportanceLevel;
    priority: number;
    category: string | null;
    tags: string[];
    startDate: Date | null;
    targetDate: Date | null;
    completedAt: Date | null;
    archivedAt: Date | null;
    folderId: GoalFolderId | null;
    parentGoalId: GoalId | null;
    sortOrder: number;
    reminderConfig: GoalReminderConfigDTO | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    keyResults: KeyResultClientDTO[] | null;
    reviews: GoalReviewClientDTO[] | null;
    progress: number;
    isOverdue: boolean;
    daysRemaining: number | null;
    timeRangeSummary: GoalTimeRangeSummary | null;
  }) {
    super(params.id);
    this._identityId = params.identityId;
    this._name = params.name;
    this._description = params.description;
    this._color = params.color;
    this._feasibilityAnalysis = params.feasibilityAnalysis;
    this._motivation = params.motivation;
    this._status = params.status;
    this._importance = params.importance;
    this._priority = params.priority;
    this._category = params.category;
    this._tags = params.tags;
    this._startDate = params.startDate;
    this._targetDate = params.targetDate;
    this._completedAt = params.completedAt;
    this._archivedAt = params.archivedAt;
    this._folderId = params.folderId;
    this._parentGoalId = params.parentGoalId;
    this._sortOrder = params.sortOrder;
    this._reminderConfig = params.reminderConfig;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
    this._keyResults = params.keyResults;
    this._reviews = params.reviews;
    this._progress = params.progress;
    this._isOverdue = params.isOverdue;
    this._daysRemaining = params.daysRemaining;
    this._timeRangeSummary = params.timeRangeSummary;
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

  get feasibilityAnalysis(): string | null {
    return this._feasibilityAnalysis;
  }

  get motivation(): string | null {
    return this._motivation;
  }

  get status(): GoalStatus {
    return this._status;
  }

  get importance(): ImportanceLevel {
    return this._importance;
  }

  get priority(): number {
    return this._priority;
  }

  get category(): string | null {
    return this._category;
  }

  get tags(): string[] {
    return [...this._tags];
  }

  get startDate(): Date | null {
    return this._startDate;
  }

  get targetDate(): Date | null {
    return this._targetDate;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  get archivedAt(): Date | null {
    return this._archivedAt;
  }

  get folderId(): GoalFolderId | null {
    return this._folderId;
  }

  get parentGoalId(): GoalId | null {
    return this._parentGoalId;
  }

  get sortOrder(): number {
    return this._sortOrder;
  }

  get reminderConfig(): GoalReminderConfig | null {
    return this._reminderConfig as GoalReminderConfig | null;
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

  get keyResults(): KeyResultClientDTO[] | null {
    return this._keyResults ? [...this._keyResults] : null;
  }

  get reviews(): GoalReviewClientDTO[] | null {
    return this._reviews ? [...this._reviews] : null;
  }

  // UI 计算属性
  get progress(): number {
    return this._progress;
  }

  get isOverdue(): boolean {
    return this._isOverdue;
  }

  get daysRemaining(): number | null {
    return this._daysRemaining;
  }

  get timeRangeSummary(): GoalTimeRangeSummary | null {
    return this._timeRangeSummary;
  }

  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: GoalClientDTO): Goal {
    // 计算 UI 字段
    const now = Date.now();
    const targetDate = dto.targetDate ? new Date(dto.targetDate) : null;
    const isOverdue = targetDate !== null && targetDate.getTime() < now && dto.status !== GoalStatus.Completed;
    const daysRemaining = targetDate
      ? Math.ceil((targetDate.getTime() - now) / (1000 * 60 * 60 * 24))
      : null;

    return new Goal({
      id: GoalId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      name: dto.name,
      description: dto.description,
      color: dto.color,
      feasibilityAnalysis: dto.feasibilityAnalysis,
      motivation: dto.motivation,
      status: dto.status,
      importance: dto.importance,
      priority: dto.priority ?? 0,
      category: dto.category,
      tags: dto.tags ?? [],
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
      archivedAt: dto.archivedAt ? new Date(dto.archivedAt) : null,
      folderId: dto.folderId ? GoalFolderId.of(dto.folderId) : null,
      parentGoalId: dto.parentGoalId ? GoalId.of(dto.parentGoalId) : null,
      sortOrder: dto.sortOrder,
      reminderConfig: dto.reminderConfig,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      keyResults: dto.keyResults,
      reviews: dto.reviews,
      progress: dto.progress ?? 0,
      isOverdue,
      daysRemaining,
      timeRangeSummary: dto.timeRangeSummary,
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): GoalClientDTO {
    return {
      id: String(this.id) as GoalClientDTO['id'],
      identityId: String(this._identityId) as GoalClientDTO['identityId'],
      name: this._name,
      description: this._description,
      color: this._color,
      feasibilityAnalysis: this._feasibilityAnalysis,
      motivation: this._motivation,
      status: this._status,
      importance: this._importance,
      priority: this._priority,
      category: this._category,
      tags: [...this._tags],
      startDate: this._startDate?.getTime() ?? null,
      targetDate: this._targetDate?.getTime() ?? null,
      completedAt: this._completedAt?.getTime() ?? null,
      archivedAt: this._archivedAt?.getTime() ?? null,
      folderId: this._folderId ? (String(this._folderId) as GoalClientDTO['folderId']) : null,
      parentGoalId: this._parentGoalId ? (String(this._parentGoalId) as GoalClientDTO['parentGoalId']) : null,
      sortOrder: this._sortOrder,
      reminderConfig: this._reminderConfig,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      keyResults: this._keyResults ? [...this._keyResults] : null,
      reviews: this._reviews ? [...this._reviews] : null,
      progress: this._progress,
      timeRangeSummary: this._timeRangeSummary,
    };
  }
}
