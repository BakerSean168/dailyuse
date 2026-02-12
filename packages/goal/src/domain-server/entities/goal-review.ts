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
import { GoalReviewId, GoalId } from '@dailyuse/domain-shared';

// 内部状态接口
interface GoalReviewState {
  id: IGoalReviewId;
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

/**
 * GoalReview 实体
 */
export class GoalReview extends Entity<IGoalReviewId> implements GoalReviewServer {
  private _props: GoalReviewState;

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
    this._props = {
      id,
      goalId: params.goalId,
      type: params.type,
      rating: params.rating,
      summary: params.summary,
      achievements: params.achievements ?? null,
      challenges: params.challenges ?? null,
      improvements: params.improvements ?? null,
      keyResultSnapshots: params.keyResultSnapshots ?? [],
      reviewedAt: params.reviewedAt,
      version: params.version ?? 1,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
      deletedAt: params.deletedAt ?? null,
    };
  }

  // ================= Getters =================

  get goalId(): IGoalId {
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

  get keyResultSnapshots(): KeyResultSnapshotDTO[] {
    return [...this._props.keyResultSnapshots];
  }

  get reviewedAt(): DomainDate {
    return this._props.reviewedAt;
  }

  get version(): number {
    return this._props.version;
  }

  get createdAt(): DomainDate {
    return this._props.createdAt;
  }

  get updatedAt(): DomainDate {
    return this._props.updatedAt;
  }

  get deletedAt(): DomainDate | null {
    return this._props.deletedAt;
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
      goalId: GoalId.of(dto.goalId),
      type: dto.type,
      rating: dto.rating,
      summary: dto.summary,
      achievements: dto.achievements ?? null,
      challenges: dto.challenges ?? null,
      improvements: dto.improvements ?? null,
      keyResultSnapshots: dto.keyResultSnapshots ?? [],
      reviewedAt: new Date(dto.reviewedAt),
      version: dto.version ?? 1,
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
      goalId: GoalId.of(dto.goalId),
      type: dto.type as ReviewType,
      rating: dto.rating,
      summary: dto.summary,
      achievements: dto.achievements ?? null,
      challenges: dto.challenges ?? null,
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
    this._props.rating = rating;
    this._props.updatedAt = new Date();
  }

  /**
   * 更新总结
   */
  public updateSummary(summary: string): void {
    const trimmed = summary.trim();
    if (trimmed.length === 0) {
      throw new Error('Summary cannot be empty');
    }
    this._props.summary = trimmed;
    this._props.updatedAt = new Date();
  }

  /**
   * 添加成就
   */
  public addAchievement(achievement: string): void {
    const trimmed = achievement.trim();
    if (trimmed.length === 0) return;

    if (this._props.achievements) {
      this._props.achievements += '\n' + trimmed;
    } else {
      this._props.achievements = trimmed;
    }
    this._props.updatedAt = new Date();
  }

  /**
   * 添加挑战
   */
  public addChallenge(challenge: string): void {
    const trimmed = challenge.trim();
    if (trimmed.length === 0) return;

    if (this._props.challenges) {
      this._props.challenges += '\n' + trimmed;
    } else {
      this._props.challenges = trimmed;
    }
    this._props.updatedAt = new Date();
  }

  /**
   * 添加改进建议
   */
  public addImprovement(improvement: string): void {
    const trimmed = improvement.trim();
    if (trimmed.length === 0) return;

    if (this._props.improvements) {
      this._props.improvements += '\n' + trimmed;
    } else {
      this._props.improvements = trimmed;
    }
    this._props.updatedAt = new Date();
  }

  /**
   * 🗑️ 软删除
   */
  public softDelete(): void {
    if (this._props.deletedAt) {
      return; // 已经删除
    }
    this._props.deletedAt = new Date();
    this._props.updatedAt = new Date();
  }

  /**
   * 是否为高质量回顾（评分>=4）
   */
  public isHighQuality(): boolean {
    return this._props.rating >= 4;
  }

  // ================= Serialization =================

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): GoalReviewServerDTO {
    return {
      id: this.id,
      goalId: this._props.goalId,
      type: this._props.type,
      rating: this._props.rating,
      summary: this._props.summary,
      achievements: this._props.achievements,
      challenges: this._props.challenges,
      improvements: this._props.improvements,
      keyResultSnapshots: this._props.keyResultSnapshots,
      reviewedAt: this._props.reviewedAt.getTime() as TransferDate,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() as TransferDate : null,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): import('@dailyuse/contracts/goal').GoalReviewClientDTO {
    return {
      id: String(this.id) as import('@dailyuse/contracts/goal').GoalReviewClientDTO['id'],
      goalId: String(this._props.goalId) as import('@dailyuse/contracts/goal').GoalReviewClientDTO['goalId'],
      type: this._props.type,
      rating: this._props.rating,
      summary: this._props.summary,
      achievements: this._props.achievements,
      challenges: this._props.challenges,
      improvements: this._props.improvements,
      keyResultSnapshots: this._props.keyResultSnapshots,
      version: this._props.version,
      reviewedAt: this._props.reviewedAt.getTime(),
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): GoalReviewPersistenceDTO {
    return {
      id: this.id,
      goalId: this._props.goalId,
      type: this._props.type,
      rating: this._props.rating,
      summary: this._props.summary,
      achievements: this._props.achievements,
      challenges: this._props.challenges,
      improvements: this._props.improvements,
      keyResultSnapshots: JSON.stringify(this._props.keyResultSnapshots),
      reviewedAt: this._props.reviewedAt as PersistenceDate,
      version: this._props.version,
      createdAt: this._props.createdAt as PersistenceDate,
      updatedAt: this._props.updatedAt as PersistenceDate,
      deletedAt: this._props.deletedAt as PersistenceDate | null,
    };
  }
}
