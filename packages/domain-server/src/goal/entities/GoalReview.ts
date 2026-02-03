/**
 * GoalReview 实体
 * 目标回顾实体
 *
 * 【规范说明：实体（Entity）】
 * 实体与值对象的区别在于：
 * - 拥有唯一标识（通过 id）
 * - 可以改变状态
 * - 生命周期内身份保持不变（同一个 id）
 *
 * 【GoalReview 职责】
 * - 管理目标的定期回顾记录
 * - 记录评分、总结和关键结果快照
 * - 支持回顾内容更新（评分、总结、成就等）
 * - 质量评估（高质量回顾识别）
 *
 * 【不变量（Invariants）】
 * 这些条件必须始终保持真：
 * - 0 <= rating <= 10
 * - summary 不能为空
 * - reviewedAt <= createdAt（或接近）
 */

import { Entity } from '@dailyuse/utils';
import { GoalReviewId, GoalId } from '@dailyuse/domain-shared';
import type {
  GoalReviewPersistenceDTO,
  GoalReviewServer,
  GoalReviewServerDTO,
  KeyResultSnapshotDTO,
} from '@dailyuse/contracts/goal';
import { ReviewType } from '@dailyuse/contracts/goal';

/**
 * GoalReview 实体
 */
export class GoalReview extends Entity<GoalReviewId> implements GoalReviewServer {
  // ================= 1. 内部状态 (Backing Fields) =================
  private _goalId: GoalId;
  private _type: ReviewType;
  private _rating: number;
  private _summary: string;
  private _achievements: string | null;
  private _challenges: string | null;
  private _improvements: string | null;
  private _keyResultSnapshots: KeyResultSnapshotDTO[];
  private _reviewedAt: Date;
  private _createdAt: Date;

  // ================= 2. 构造函数 (Private) =================
  private constructor(props: GoalReviewServerDTO) {
    super(props.uuid as GoalReviewId);
    this._goalId = props.goalUuid as GoalId;
    this._type = props.type;
    this._rating = props.rating;
    this._summary = props.summary;
    this._achievements = props.achievements ?? null;
    this._challenges = props.challenges ?? null;
    this._improvements = props.improvements ?? null;
    this._keyResultSnapshots = props.keyResultSnapshots;
    this._reviewedAt = new Date(props.reviewedAt);
    this._createdAt = new Date(props.createdAt);
  }

  // ================= 3. 公共属性 (Getters) =================
  get goalUuid(): string {
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
    return this._keyResultSnapshots;
  }

  get reviewedAt(): Date {
    return this._reviewedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // ================= 4. 工厂方法 (Factories) =================

  /**
   * 🏭 业务工厂：创建新的目标回顾
   */
  public static create(params: {
    goalId: GoalId;
    type: ReviewType;
    rating: number;
    summary: string;
    achievements?: string;
    challenges?: string;
    improvements?: string;
    keyResultSnapshots?: KeyResultSnapshotDTO[];
    reviewedAt?: number;
  }): GoalReview {
    // 验证
    if (!params.goalId) {
      throw new Error('Goal ID is required');
    }
    if (params.rating < 0 || params.rating > 10) {
      throw new Error('Rating must be between 0 and 10');
    }
    if (!params.summary || params.summary.trim().length === 0) {
      throw new Error('Summary is required');
    }

    const now = Date.now();
    const uuid = Entity.generateUUID();

    return new GoalReview({
      uuid,
      goalUuid: params.goalId,
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
   * 🏭 恢复工厂：从 ServerDTO 恢复
   */
  public static fromServerDTO(dto: GoalReviewServerDTO): GoalReview {
    return new GoalReview(dto);
  }

  /**
   * 🏭 恢复工厂：从 PersistenceDTO 恢复
   */
  public static fromPersistenceDTO(dto: GoalReviewPersistenceDTO): GoalReview {
    // 解析 JSON 字符串
    const snapshots = JSON.parse(dto.keyResultSnapshots) as KeyResultSnapshotDTO[];

    const serverDTO: GoalReviewServerDTO = {
      uuid: dto.id,
      goalUuid: dto.goalUuid,
      type: dto.type,
      rating: dto.rating,
      summary: dto.summary,
      achievements: dto.achievements,
      challenges: dto.challenges,
      improvements: dto.improvements,
      keyResultSnapshots: snapshots,
      reviewedAt: dto.reviewedAt.getTime(),
      createdAt: dto.createdAt.getTime(),
    };
    return new GoalReview(serverDTO);
  }

  // ================= 5. 业务行为 (Business Actions) =================

  /**
   * ✅ 更新评分
   */
  public updateRating(rating: number): void {
    if (rating < 0 || rating > 10) {
      throw new Error('Rating must be between 0 and 10');
    }
    this._rating = rating;
  }

  /**
   * ✅ 更新总结
   */
  public updateSummary(summary: string): void {
    const trimmed = summary.trim();
    if (trimmed.length === 0) {
      throw new Error('Summary cannot be empty');
    }
    this._summary = trimmed;
  }

  /**
   * ✅ 添加成就
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
   * ✅ 添加挑战
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
   * ✅ 添加改进建议
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
   * 📊 是否为高质量回顾（评分>=4）
   */
  public isHighQuality(): boolean {
    return this._rating >= 4;
  }

  // ================= 6. 序列化 (Serialization) =================

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): GoalReviewServerDTO {
    return {
      uuid: this.id as string,
      goalUuid: this._goalId,
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

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): GoalReviewPersistenceDTO {
    return {
      id: this.id as string,
      type: this._type,
      rating: this._rating,
      summary: this._summary,
      achievements: this._achievements,
      challenges: this._challenges,
      improvements: this._improvements,
      keyResultSnapshots: JSON.stringify(this._keyResultSnapshots),
      reviewedAt: this._reviewedAt,
      createdAt: this._createdAt,
    };
  }
}
