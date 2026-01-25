/**
 * GoalReview 实体
 * 目标回顾实体
 *
 * DDD 实体职责：
 * - 管理目标的定期回顾记录
 * - 记录评分、总结和关键结果快照
 * - 执行回顾相关的业务逻辑
 */

import { Entity } from '@dailyuse/utils';
import type { GoalReviewClientDTO, GoalReviewPersistenceDTO, GoalReviewServer, GoalReviewServerDTO, KeyResultSnapshotServerDTO } from '@dailyuse/contracts/goal';
import { ReviewType } from '@dailyuse/contracts/goal';

/**
 * GoalReview 实体
 */
export class GoalReview extends Entity implements GoalReviewServer {
  // ===== 私有字段 =====
  private _goalUuid: string;
  private _type: ReviewType;
  private _rating: number;
  private _summary: string;
  private _achievements: string | null;
  private _challenges: string | null;
  private _improvements: string | null;
  private _keyResultSnapshots: KeyResultSnapshotServerDTO[];
  private _reviewedAt: Date;
  private _createdAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    goalUuid: string;
    type: ReviewType;
    rating: number;
    summary: string;
    achievements?: string | null;
    challenges?: string | null;
    improvements?: string | null;
    keyResultSnapshots: KeyResultSnapshotServerDTO[];
    reviewedAt: number;
    createdAt: number;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._goalUuid = params.goalUuid;
    this._type = params.type;
    this._rating = params.rating;
    this._summary = params.summary;
    this._achievements = params.achievements ?? null;
    this._challenges = params.challenges ?? null;
    this._improvements = params.improvements ?? null;
    this._keyResultSnapshots = params.keyResultSnapshots;
    this._reviewedAt = params.reviewedAt;
    this._createdAt = params.createdAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get goalUuid(): string {
    return this._goalUuid;
  }
  public get type(): ReviewType {
    return this._type;
  }
  public get rating(): number {
    return this._rating;
  }
  public get summary(): string {
    return this._summary;
  }
  public get achievements(): string | null {
    return this._achievements;
  }
  public get challenges(): string | null {
    return this._challenges;
  }
  public get improvements(): string | null {
    return this._improvements;
  }
  public get keyResultSnapshots(): KeyResultSnapshotServerDTO[] {
    return this._keyResultSnapshots;
  }
  public get reviewedAt(): Date {
    return this._reviewedAt;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 GoalReview 实体
   */
  public static create(params: {
    goalUuid: string;
    type: ReviewType;
    rating: number;
    summary: string;
    achievements?: string;
    challenges?: string;
    improvements?: string;
    keyResultSnapshots?: KeyResultSnapshotServerDTO[];
    reviewedAt?: number;
  }): GoalReview {
    // 验证
    if (!params.goalUuid) {
      throw new Error('Goal UUID is required');
    }
    if (params.rating < 0 || params.rating > 10) {
      throw new Error('Rating must be between 0 and 10');
    }
    if (!params.summary || params.summary.trim().length === 0) {
      throw new Error('Summary is required');
    }

    const now = Date.now();

    return new GoalReview({
      goalUuid: params.goalUuid,
      type: params.type,
      rating: params.rating,
      summary: params.summary.trim(),
      achievements: params.achievements?.trim() || null,
      challenges: params.challenges?.trim() || null,
      improvements: params.improvements?.trim() || null,
      keyResultSnapshots: params.keyResultSnapshots ?? [],
      reviewedAt: params.reviewedAt ?? now,
      createdAt: now,
    });
  }

  /**
   * 从 Server DTO 重建实体
   */
  public static fromServerDTO(dto: GoalReviewServerDTO): GoalReview {
    return new GoalReview({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      type: dto.type,
      rating: dto.rating,
      summary: dto.summary,
      achievements: dto.achievements ?? null,
      challenges: dto.challenges ?? null,
      improvements: dto.improvements ?? null,
      keyResultSnapshots: dto.keyResultSnapshots,
      reviewedAt: dto.reviewedAt,
      createdAt: new Date(dto.createdAt),
    });
  }

  /**
   * 从持久化 DTO 重建实体
   */
  public static fromPersistenceDTO(dto: GoalReviewPersistenceDTO): GoalReview {
    // 解析 JSON 字符串
    const snapshots = JSON.parse(dto.keyResultSnapshots) as KeyResultSnapshotServerDTO[];

    return new GoalReview({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      type: dto.type,
      rating: dto.rating,
      summary: dto.summary,
      achievements: dto.achievements ?? null,
      challenges: dto.challenges ?? null,
      improvements: dto.improvements ?? null,
      keyResultSnapshots: snapshots,
      reviewedAt: dto.reviewedAt,
      createdAt: new Date(dto.createdAt),
    });
  }

  // ===== 业务方法 =====

  /**
   * 更新评分
   */
  public updateRating(rating: number): void {
    if (rating < 0 || rating > 10) {
      throw new Error('Rating must be between 0 and 10');
    }
    this._rating = rating;
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
  }

  /**
   * 是否为高质量回顾（评分>=4）
   */
  public isHighQuality(): boolean {
    return this._rating >= 4;
  }

  // ===== DTO 转换 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): GoalReviewServerDTO {
    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      type: this._type,
      rating: this._rating,
      summary: this._summary,
      achievements: this._achievements,
      challenges: this._challenges,
      improvements: this._improvements,
      keyResultSnapshots: this._keyResultSnapshots,
      reviewedAt: this._reviewedAt.getTime(),
      createdAt: this._createdAt.getTime(),
    };
  }

  public toClientDTO(): GoalReviewClientDTO {
    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      type: this._type,
      rating: this._rating,
      summary: this._summary,
      achievements: this._achievements,
      challenges: this._challenges,
      improvements: this._improvements,
      keyResultSnapshots: this._keyResultSnapshots.map((snapshot) => ({
        keyResultUuid: snapshot.keyResultUuid,
        title: snapshot.title,
        targetValue: snapshot.targetValue,
        currentValue: snapshot.currentValue,
        progressPercentage: snapshot.progressPercentage,
      })),
      reviewedAt: this._reviewedAt.getTime(),
      createdAt: this._createdAt.getTime(),
    };
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): GoalReviewPersistenceDTO {
    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      type: this._type,
      rating: this._rating,
      summary: this._summary,
      achievements: this._achievements,
      challenges: this._challenges,
      improvements: this._improvements,
      keyResultSnapshots: JSON.stringify(this._keyResultSnapshots),
      reviewedAt: this._reviewedAt.getTime(),
      createdAt: this._createdAt.getTime(),
    };
  }
}
