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

import type {
  GoalClientDTO,
  GoalReminderConfig,
} from '@dailyuse/contracts/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import { AggregateRoot } from '@dailyuse/utils';
import { GoalId, GoalFolderId } from '@/domain-shared';
import { IdentityId } from '@dailyuse/domain-shared/shared';
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
  startDate: Date | null;
  targetDate: Date | null;
  completedAt: Date | null;
  archivedAt: Date | null;
  folderId: GoalFolderId | null;
  parentGoalId: GoalId | null;
  sortOrder: number;
  reminderConfig: GoalReminderConfig | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  keyResults: KeyResult[] | null;
  reviews: GoalReview[] | null;
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

  get startDate(): Date | null {
    return this._props.startDate;
  }

  get targetDate(): Date | null {
    return this._props.targetDate;
  }

  get completedAt(): Date | null {
    return this._props.completedAt;
  }

  get archivedAt(): Date | null {
    return this._props.archivedAt;
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

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this._props.deletedAt;
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
    return {
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
      startDate: this._props.startDate?.getTime() ?? null,
      targetDate: this._props.targetDate?.getTime() ?? null,
      completedAt: this._props.completedAt?.getTime() ?? null,
      archivedAt: this._props.archivedAt?.getTime() ?? null,
      folderId: this._props.folderId ? (String(this._props.folderId) as GoalClientDTO['folderId']) : null,
      parentGoalId: this._props.parentGoalId ? (String(this._props.parentGoalId) as GoalClientDTO['parentGoalId']) : null,
      sortOrder: this._props.sortOrder,
      reminderConfig: this._props.reminderConfig ?? null,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      keyResults: this._props.keyResults?.map(kr => (kr as KeyResult).toDTO()) ?? null,
      reviews: this._props.reviews?.map(r => (r as GoalReview).toDTO()) ?? null,
    };
  }
}
