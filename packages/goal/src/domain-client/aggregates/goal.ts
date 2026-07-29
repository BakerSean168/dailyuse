import type { Instant } from '@memoflow/contracts/primitives';
/**
 * Goal Aggregate Root - Domain Client
 * 目标聚合根 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with props object
 * - Public getters via this._props.xxx
 * - Static load(state: GoalState): Goal
 * - Instance toDTO(): GoalClientDTO
 */

import type { GoalClientDTO, GoalReminderConfig } from '@memoflow/contracts/goal';
import { GoalStatus } from '@memoflow/contracts/goal';
import type { ImportanceLevel } from '@memoflow/contracts/shared';
import { AggregateRoot } from '@memoflow/utils/domain';
import { GoalId, GoalFolderId } from '../../server/domain';
import { IdentityId } from '@memoflow/domain-shared/shared';
import { KeyResult, GoalReview } from '../entities';

export interface GoalState {
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
  startDate: Instant | null;
  targetDate: Instant | null;
  completedAt: Instant | null;
  archivedAt: Instant | null;
  folderId: GoalFolderId | null;
  parentGoalId: GoalId | null;
  sortOrder: number;
  reminderConfig: GoalReminderConfig | null;
  version: number;
  createdAt: Instant;
  updatedAt: Instant;
  deletedAt: Instant | null;
  keyResults: KeyResult[] | null;
  reviews: GoalReview[] | null;
  totalKeyResults?: number;
  completedKeyResults?: number;
  overallProgress?: number;
}

export class Goal extends AggregateRoot<GoalId> {
  private readonly _props: GoalState;

  private constructor(props: GoalState) {
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

  get feasibilityAnalysis(): string | null {
    return this._props.feasibilityAnalysis;
  }

  get motivation(): string | null {
    return this._props.motivation;
  }

  get status(): GoalStatus {
    return this._props.status;
  }

  get importance(): ImportanceLevel {
    return this._props.importance;
  }

  get priority(): number {
    return this._props.priority;
  }

  get category(): string | null {
    return this._props.category;
  }

  get tags(): string[] {
    return [...this._props.tags];
  }

  get startDate(): Instant | null {
    const v = this._props.startDate;
    if (v == null) return null;
    return v as Instant;
  }

  get targetDate(): Instant | null {
    const v = this._props.targetDate;
    if (v == null) return null;
    return v as Instant;
  }

  get completedAt(): Instant | null {
    const v = this._props.completedAt;
    if (v == null) return null;
    return v as Instant;
  }

  get archivedAt(): Instant | null {
    const v = this._props.archivedAt;
    if (v == null) return null;
    return v as Instant;
  }

  get folderId(): GoalFolderId | null {
    return this._props.folderId;
  }

  get parentGoalId(): GoalId | null {
    return this._props.parentGoalId;
  }

  get sortOrder(): number {
    return this._props.sortOrder;
  }

  get reminderConfig(): GoalReminderConfig | null {
    return this._props.reminderConfig;
  }

  get version(): number {
    return this._props.version;
  }

  get createdAt(): Instant {
    const v = this._props.createdAt;
    return v as Instant;
  }

  get updatedAt(): Instant {
    const v = this._props.updatedAt;
    return v as Instant;
  }

  get deletedAt(): Instant | null {
    const v = this._props.deletedAt;
    if (v == null) return null;
    return v as Instant;
  }

  get keyResults(): KeyResult[] | null {
    return this._props.keyResults as KeyResult[] | null;
  }

  get reviews(): GoalReview[] | null {
    return this._props.reviews as GoalReview[] | null;
  }

  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
  }

  // ================= Factory Methods =================
  public static load(state: GoalState): Goal {
    return new Goal(state);
  }

  // ================= DTO Conversion =================
  public toDTO(): GoalClientDTO {
    const dto: GoalClientDTO = {
      id: String(this._props.id) as GoalClientDTO['id'],
      identityId: String(this._props.identityId) as GoalClientDTO['identityId'],
      name: this._props.name,
      description: this._props.description,
      color: this._props.color,
      feasibilityAnalysis: this._props.feasibilityAnalysis,
      motivation: this._props.motivation,
      status: this._props.status,
      importance: this._props.importance,
      priority: this._props.priority,
      category: this._props.category,
      tags: [...this._props.tags],
      startDate: this._props.startDate ?? null,
      targetDate: this._props.targetDate ?? null,
      completedAt: this._props.completedAt ?? null,
      archivedAt: this._props.archivedAt ?? null,
      folderId: this._props.folderId
        ? (String(this._props.folderId) as GoalClientDTO['folderId'])
        : null,
      parentGoalId: this._props.parentGoalId
        ? (String(this._props.parentGoalId) as GoalClientDTO['parentGoalId'])
        : null,
      sortOrder: this._props.sortOrder,
      reminderConfig: this._props.reminderConfig ?? null,
      version: this._props.version,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      deletedAt: this._props.deletedAt ?? null,
      keyResults: this._props.keyResults?.map((kr) => (kr as KeyResult).toDTO()) ?? null,
      reviews: this._props.reviews?.map((r) => (r as GoalReview).toDTO()) ?? null,
    };

    return {
      ...dto,
      totalKeyResults: this._props.totalKeyResults ?? (this._props.keyResults?.length ?? 0),
      completedKeyResults:
        this._props.completedKeyResults ??
        (this._props.keyResults?.filter((kr) => (kr as KeyResult).progressPercentage >= 100).length ?? 0),
      overallProgress:
        this._props.overallProgress ??
        (() => {
          const keyResults = this._props.keyResults ?? [];
          if (keyResults.length === 0) return 0;
          const totalWeight = keyResults.reduce((sum, kr) => sum + ((kr as KeyResult).weight ?? 1), 0);
          if (totalWeight <= 0) {
            const average =
              keyResults.reduce((sum, kr) => sum + (kr as KeyResult).progressPercentage, 0) /
              keyResults.length;
            return Math.round(average * 100) / 100;
          }
          const weighted =
            keyResults.reduce(
              (sum, kr) =>
                sum + (kr as KeyResult).progressPercentage * ((kr as KeyResult).weight ?? 1),
              0,
            ) / totalWeight;
          return Math.round(weighted * 100) / 100;
        })(),
    } as GoalClientDTO;
  }
}
