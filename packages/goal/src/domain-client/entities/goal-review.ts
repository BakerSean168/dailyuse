/**
 * GoalReview Entity - Domain Client
 * 目标复盘实体 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with props object
 * - Public getters via this._props.xxx
 * - Static load(state: GoalReviewState): GoalReview
 * - Instance toDTO(): GoalReviewClientDTO
 */

import type { GoalReviewClientDTO, KeyResultSnapshot, ReviewType } from '@memoflow/contracts/goal';
import { Entity } from '@memoflow/utils/domain';
import { GoalReviewId, GoalId } from '../../server/domain';

export interface GoalReviewState {
  id: GoalReviewId;
  goalId: GoalId;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  improvements: string | null;
  keyResultSnapshots: KeyResultSnapshot[];
  /** ADR-037 Instant epoch ms */
  reviewedAt: number;
  createdAt: number;
  updatedAt: number;
}

export class GoalReview extends Entity<GoalReviewId> {
  // ================= 1. Props =================
  private readonly _props: GoalReviewState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: GoalReviewState) {
    super(props.id);
    this._props = props;
  }

  // ================= 3. Getters =================
  get goalId(): GoalId {
    return this._props.goalId;
  }

  get type(): ReviewType {
    return this._props.type;
  }

  get rating(): number {
    return this._props.rating;
  }

  get summary(): string {
    return this._props.summary;
  }

  get achievements(): string | null {
    return this._props.achievements;
  }

  get challenges(): string | null {
    return this._props.challenges;
  }

  get improvements(): string | null {
    return this._props.improvements;
  }

  get keyResultSnapshots(): KeyResultSnapshot[] {
    return [...this._props.keyResultSnapshots];
  }

  get reviewedAt(): number {
    return this._props.reviewedAt;
  }

  get createdAt(): number {
    return this._props.createdAt;
  }

  get updatedAt(): number {
    return this._props.updatedAt;
  }

  // ================= 4. Factory Methods =================
  public static load(state: GoalReviewState): GoalReview {
    return new GoalReview(state);
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): GoalReviewClientDTO {
    return {
      id: String(this.id) as GoalReviewClientDTO['id'],
      goalId: String(this._props.goalId) as GoalReviewClientDTO['goalId'],
      type: this._props.type,
      rating: this._props.rating,
      summary: this._props.summary,
      achievements: this._props.achievements,
      challenges: this._props.challenges,
      improvements: this._props.improvements,
      keyResultSnapshots: [...this._props.keyResultSnapshots],
      reviewedAt: this._props.reviewedAt,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
    };
  }
}
