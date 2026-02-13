/**
 * GoalStatistics - 目标统计聚合根
 *
 * 负责维护某账户下目标相关的统计数据。
 * 每个 identityId 对应一条统计记录（UPSERT 语义）。
 */

export interface GoalStatisticsPersistenceDTO {
  identityId: string;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  archivedGoals: number;
  overdueGoals: number;
  totalKeyResults: number;
  completedKeyResults: number;
  averageProgress: number;
  goalsByImportance: unknown;
  goalsByCategory: unknown;
  goalsByStatus: unknown;
  goalsCreatedThisWeek: number;
  goalsCompletedThisWeek: number;
  goalsCreatedThisMonth: number;
  goalsCompletedThisMonth: number;
  totalReviews: number;
  averageRating: number;
  lastCalculatedAt: number;
}

export class GoalStatistics {
  private constructor(private readonly data: GoalStatisticsPersistenceDTO) {}

  get identityId(): string {
    return this.data.identityId;
  }

  get totalGoals(): number {
    return this.data.totalGoals;
  }

  get activeGoals(): number {
    return this.data.activeGoals;
  }

  get completedGoals(): number {
    return this.data.completedGoals;
  }

  get archivedGoals(): number {
    return this.data.archivedGoals;
  }

  get overdueGoals(): number {
    return this.data.overdueGoals;
  }

  get totalKeyResults(): number {
    return this.data.totalKeyResults;
  }

  get completedKeyResults(): number {
    return this.data.completedKeyResults;
  }

  get averageProgress(): number {
    return this.data.averageProgress;
  }

  get totalReviews(): number {
    return this.data.totalReviews;
  }

  get averageRating(): number {
    return this.data.averageRating;
  }

  get lastCalculatedAt(): number {
    return this.data.lastCalculatedAt;
  }

  toPersistenceDTO(): GoalStatisticsPersistenceDTO {
    return { ...this.data };
  }

  static fromPersistenceDTO(dto: GoalStatisticsPersistenceDTO): GoalStatistics {
    return new GoalStatistics(dto);
  }

  static createEmpty(identityId: string): GoalStatistics {
    return new GoalStatistics({
      identityId,
      totalGoals: 0,
      activeGoals: 0,
      completedGoals: 0,
      archivedGoals: 0,
      overdueGoals: 0,
      totalKeyResults: 0,
      completedKeyResults: 0,
      averageProgress: 0,
      goalsByImportance: {},
      goalsByCategory: {},
      goalsByStatus: {},
      goalsCreatedThisWeek: 0,
      goalsCompletedThisWeek: 0,
      goalsCreatedThisMonth: 0,
      goalsCompletedThisMonth: 0,
      totalReviews: 0,
      averageRating: 0,
      lastCalculatedAt: Date.now(),
    });
  }
}
