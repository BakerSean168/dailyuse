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
  KeyResultSnapshotDTO,
  ReviewType,
} from '@dailyuse/contracts/goal';
import { Entity } from '@dailyuse/utils';
import { GoalReviewId } from '@dailyuse/domain-shared/goal';

export class GoalReview extends Entity<GoalReviewId> implements GoalReviewClient {
  // ================= 1. Backing Fields =================
  private _uuid: string;
  private _goalUuid: string;
  private _type: ReviewType;
  private _rating: number;
  private _summary: string;
  private _achievements: string | null;
  private _challenges: string | null;
  private _improvements: string | null;
  private _keyResultSnapshots: KeyResultSnapshotDTO[];
  private _version: number;
  private _reviewedAt: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: GoalReviewId;
    uuid: string;
    goalUuid: string;
    type: ReviewType;
    rating: number;
    summary: string;
    achievements: string | null;
    challenges: string | null;
    improvements: string | null;
    keyResultSnapshots: KeyResultSnapshotDTO[];
    version: number;
    reviewedAt: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    super(params.id);
    this._uuid = params.uuid;
    this._goalUuid = params.goalUuid;
    this._type = params.type;
    this._rating = params.rating;
    this._summary = params.summary;
    this._achievements = params.achievements;
    this._challenges = params.challenges;
    this._improvements = params.improvements;
    this._keyResultSnapshots = params.keyResultSnapshots;
    this._version = params.version;
    this._reviewedAt = params.reviewedAt;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ================= 3. Getters =================
  get uuid(): string {
    return this._uuid;
  }

  get goalUuid(): string {
    return this._goalUuid;
  }

  get type(): ReviewType {
    return this._type;
  }

  get rating(): number {
    return this._rating;
  }

  get summary(): string {
    return this._summary;
  }

  get achievements(): string | null {
    return this._achievements;
  }

  get challenges(): string | null {
    return this._challenges;
  }

  get improvements(): string | null {
    return this._improvements;
  }

  get keyResultSnapshots(): KeyResultSnapshotDTO[] {
    return [...this._keyResultSnapshots];
  }

  get version(): number {
    return this._version;
  }

  get reviewedAt(): number {
    return this._reviewedAt;
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

  // 计算属性
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: GoalReviewClientDTO): GoalReview {
    return new GoalReview({
      id: GoalReviewId.of(dto.uuid),
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      type: dto.type,
      rating: dto.rating,
      summary: dto.summary,
      achievements: dto.achievements,
      challenges: dto.challenges,
      improvements: dto.improvements,
      keyResultSnapshots: dto.keyResultSnapshots ?? [],
      version: dto.version,
      reviewedAt: dto.reviewedAt,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): GoalReviewClientDTO {
    return {
      uuid: this._uuid,
      goalUuid: this._goalUuid,
      type: this._type,
      rating: this._rating,
      summary: this._summary,
      achievements: this._achievements,
      challenges: this._challenges,
      improvements: this._improvements,
      keyResultSnapshots: [...this._keyResultSnapshots],
      version: this._version,
      reviewedAt: this._reviewedAt,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }
}
