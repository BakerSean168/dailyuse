/**
 * GoalReview Entity - Domain Client
 * 目标复盘实体 - 领域客户端
 *
 * 【规范说明】
 * - 实现 GoalReviewClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: GoalReviewClientDTO): GoalReview
 * - Instance toDTO(): GoalReviewClientDTO
 */

import type {
  GoalReviewClient,
  GoalReviewClientDTO,
  KeyResultSnapshot,
  ReviewType,
} from '@dailyuse/contracts/goal';
import { Entity } from '@dailyuse/utils';
import { GoalReviewId, GoalId } from '@dailyuse/domain-shared/goal';

// 内部状态接口
interface GoalReviewState {
  id: GoalReviewId;
  goalId: GoalId;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  improvements: string | null;
  keyResultSnapshots: KeyResultSnapshot[];
  version: number;
  reviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class GoalReview extends Entity<GoalReviewId> implements GoalReviewClient {
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

  get version(): number {
    return this._props.version;
  }

  get reviewedAt(): Date {
    return this._props.reviewedAt;
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

  // 计算属性
  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: GoalReviewClientDTO): GoalReview {
    return new GoalReview({
      id: GoalReviewId.of(dto.id),
      goalId: GoalId.of(dto.goalId),
      type: dto.type,
      rating: dto.rating,
      summary: dto.summary,
      achievements: dto.achievements,
      challenges: dto.challenges,
      improvements: dto.improvements,
      keyResultSnapshots: dto.keyResultSnapshots ?? [],
      version: dto.version,
      reviewedAt: new Date(dto.reviewedAt),
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
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
      version: this._props.version,
      reviewedAt: this._props.reviewedAt.getTime(),
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }
}
