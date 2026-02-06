/**
 * GoalReview 实体
 * 目标回顾实体
 *
 * 【规范说明：实体（Entity）】
 * - 拥有唯一标识（通过 id）
 * - 可以改变状态
 * - 生命周期内身份保持不变
 *
 * 【GoalReview 职责】
 * - 管理目标的定期回顾记录
 * - 记录评分、总结和关键结果快照
 * - 支持回顾内容更新
 * 
 * 【同步支持】
 * - deletedAt: 软删除时间戳
 * - version: 乐观锁版本号
 * - updatedAt: 最后更新时间（增量同步）
 */

import { Entity } from '@dailyuse/utils';
import type { GoalReviewId as IGoalReviewId, GoalId as IGoalId, DomainDate, TransferDate, PersistenceDate } from '@dailyuse/contracts/primitives';
import type {
  GoalReviewPersistenceDTO,
  GoalReviewServer,
  GoalReviewServerDTO,
  KeyResultSnapshotDTO,
} from '@dailyuse/contracts/goal';
import { ReviewType } from '@dailyuse/contracts/goal';
import { GoalReviewId } from '@dailyuse/domain-shared';

/**
 * GoalReview 实体
 */
export class GoalReview extends Entity<IGoalReviewId> implements GoalReviewServer {
  private _goalId: IGoalId;
  private _type: ReviewType;
  private _rating: number;
  private _summary: string;
  private _achievements: string | null;
  private _challenges: string | null;
  private _improvements: string | null;
  private _keyResultSnapshots: KeyResultSnapshotDTO[];
  private _reviewedAt: Date;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private constructor(
    id: IGoalReviewId,
    params: {
      goalId: IGoalId;
      type: ReviewType;
      rating: number;
      summary: string;
      achievements: string | null;
      challenges: string | null;
      improvements: string | null;
      keyResultSnapshots: KeyResultSnapshotDTO[];
      reviewedAt: Date;
      version: number;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
    }
  ) {
    super(id);
    this._goalId = params.goalId;
    this._type = params.type;
    this._rating = params.rating;
    this._summary = params.summary;
    this._achievements = params.achievements;
    this._challenges = params.challenges;
    this._improvements = params.improvements;
    this._keyResultSnapshots = params.keyResultSnapshots;
    this._reviewedAt = params.reviewedAt;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ================= Getters =================

  get goalId(): IGoalId {
    return this._goalId;
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

  get reviewedAt(): DomainDate {
    return this._reviewedAt;
  }

  get version(): number {
    return this._version;
  }

  get createdAt(): DomainDate {
    return this._createdAt;
  }

  get updatedAt(): DomainDate {
    return this._updatedAt;
  }

  get deletedAt(): DomainDate | null {
    return this._deletedAt;
  }

  // ================= Factory Methods =================

  /**
   * 创建新的目标回顾
   * 
   * @param params.id 可选的 ID，支持前端生成。如果不提供则自动生成
   */
  public static create(params: {
    id?: IGoalReviewId; // 支持前端生成 ID
    goalId: IGoalId;
    type: ReviewType;
    rating: number;
    summary: string;
    achievements?: string;
    challenges?: string;
    improvements?: string;
    keyResultSnapshots?: KeyResultSnapshotDTO[];
    reviewedAt?: Date;
  }): GoalReview {
    if (params.rating < 0 || params.rating > 10) {
      throw new Error('Rating must be between 0 and 10');
    }
    if (!params.summary || params.summary.trim().length === 0) {
      throw new Error('Summary is required');
    }

    const id = params.id ?? GoalReviewId.of(GoalReviewId.generate());
    const now = new Date();

    return new GoalReview(id, {
      goalId: params.goalId,
      type: params.type,
      rating: params.rating,
      summary: params.summary.trim(),
      achievements: params.achievements?.trim() ?? null,
      challenges: params.challenges?.trim() ?? null,
      improvements: params.improvements?.trim() ?? null,
      keyResultSnapshots: params.keyResultSnapshots ?? [],
      reviewedAt: params.reviewedAt ?? now,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  /**
   * 从 ServerDTO 恢复
   */
  public static fromServerDTO(dto: GoalReviewServerDTO): GoalReview {
    const id = GoalReviewId.of(dto.id);
    return new GoalReview(id, {
      goalId: dto.goalId,
      type: dto.type,
      rating: dto.rating,
      summary: dto.summary,
      achievements: dto.achievements,
      challenges: dto.challenges,
      improvements: dto.improvements,
      keyResultSnapshots: dto.keyResultSnapshots,
      reviewedAt: new Date(dto.reviewedAt),
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  /**
   * 从 PersistenceDTO 恢复
   */
  public static fromPersistenceDTO(dto: GoalReviewPersistenceDTO): GoalReview {
    const id = GoalReviewId.of(dto.id);
    const snapshots = dto.keyResultSnapshots
      ? (JSON.parse(dto.keyResultSnapshots) as KeyResultSnapshotDTO[])
      : [];

    return new GoalReview(id, {
      goalId: dto.goalId,
      type: dto.type as ReviewType,
      rating: dto.rating,
      summary: dto.summary,
      achievements: dto.achievements,
      challenges: dto.challenges,
      improvements: dto.improvements,
      keyResultSnapshots: snapshots,
      reviewedAt: dto.reviewedAt,
      version: dto.version,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    });
  }

  // ================= Business Methods =================

  /**
   * 更新评分
   */
  public updateRating(rating: number): void {
    if (rating < 0 || rating > 10) {
      throw new Error('Rating must be between 0 and 10');
    }
    this._rating = rating;
    this._updatedAt = new Date();
  }

  /**
   * 更新总结
   */
  public updateSummary(summary: string): void {
    const trimmed = summary.trim();
    if (trimmed.length === 0) {
      throw new Error('Summary cannot be empty');
    }
    this._summary = trimmed;
    this._updatedAt = new Date();
  }

  /**
   * 添加成就
   */
  public addAchievement(achievement: string): void {
    const trimmed = achievement.trim();
    if (trimmed.length === 0) return;

    if (this._achievements) {
      this._achievements += '\n' + trimmed;
    } else {
      this._achievements = trimmed;
    }
    this._updatedAt = new Date();
  }

  /**
   * 添加挑战
   */
  public addChallenge(challenge: string): void {
    const trimmed = challenge.trim();
    if (trimmed.length === 0) return;

    if (this._challenges) {
      this._challenges += '\n' + trimmed;
    } else {
      this._challenges = trimmed;
    }
    this._updatedAt = new Date();
  }

  /**
   * 添加改进建议
   */
  public addImprovement(improvement: string): void {
    const trimmed = improvement.trim();
    if (trimmed.length === 0) return;

    if (this._improvements) {
      this._improvements += '\n' + trimmed;
    } else {
      this._improvements = trimmed;
    }
    this._updatedAt = new Date();
  }

  /**
   * 🗑️ 软删除
   */
  public softDelete(): void {
    if (this._deletedAt) {
      return; // 已经删除
    }
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * 是否为高质量回顾（评分>=4）
   */
  public isHighQuality(): boolean {
    return this._rating >= 4;
  }

  // ================= Serialization =================

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): GoalReviewServerDTO {
    return {
      id: this.id,
      goalId: this._goalId,
      type: this._type,
      rating: this._rating,
      summary: this._summary,
      achievements: this._achievements,
      challenges: this._challenges,
      improvements: this._improvements,
      keyResultSnapshots: this._keyResultSnapshots,
      reviewedAt: this._reviewedAt.getTime() as TransferDate,
      version: this._version,
      createdAt: this._createdAt.getTime() as TransferDate,
      updatedAt: this._updatedAt.getTime() as TransferDate,
      deletedAt: this._deletedAt ? this._deletedAt.getTime() as TransferDate : null,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): import('@dailyuse/contracts/goal').GoalReviewClientDTO {
    return {
      uuid: String(this.id),
      goalUuid: String(this._goalId),
      type: this._type,
      rating: this._rating,
      summary: this._summary,
      achievements: this._achievements,
      challenges: this._challenges,
      improvements: this._improvements,
      keyResultSnapshots: this._keyResultSnapshots,
      version: this._version,
      reviewedAt: this._reviewedAt.getTime(),
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): GoalReviewPersistenceDTO {
    return {
      id: this.id,
      goalId: this._goalId,
      type: this._type,
      rating: this._rating,
      summary: this._summary,
      achievements: this._achievements,
      challenges: this._challenges,
      improvements: this._improvements,
      keyResultSnapshots: JSON.stringify(this._keyResultSnapshots),
      reviewedAt: this._reviewedAt as PersistenceDate,
      version: this._version,
      createdAt: this._createdAt as PersistenceDate,
      updatedAt: this._updatedAt as PersistenceDate,
      deletedAt: this._deletedAt as PersistenceDate | null,
    };
  }
}
