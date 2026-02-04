/**
 * GoalStatistics 聚合根
 *
 * TODO: This is a stub file. Full implementation needed.
 * 
 * 负责统计账户的目标相关数据，包括：
 * - 目标总数、各状态数量
 * - 关键结果统计
 * - 平均进度
 * - 分类统计
 * - 时间段统计（本周、本月）
 */

import type { ImportanceLevel } from '@dailyuse/contracts/shared';

/**
 * GoalStatistics 持久化 DTO
 */
export interface GoalStatisticsPersistenceDTO {
  accountUuid: string;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  archivedGoals: number;
  overdueGoals: number;
  totalKeyResults: number;
  completedKeyResults: number;
  averageProgress: number;
  goalsByImportance: string; // JSON string
  goalsByCategory: string; // JSON string
  goalsByStatus: string; // JSON string
  goalsCreatedThisWeek: number;
  goalsCompletedThisWeek: number;
  goalsCreatedThisMonth: number;
  goalsCompletedThisMonth: number;
  totalReviews: number;
  averageRating: number;
  lastCalculatedAt: number;
}

/**
 * GoalStatistics 聚合根
 */
export class GoalStatistics {
  private _accountUuid: string;
  private _totalGoals: number;
  private _activeGoals: number;
  private _completedGoals: number;
  private _archivedGoals: number;
  private _overdueGoals: number;
  private _totalKeyResults: number;
  private _completedKeyResults: number;
  private _averageProgress: number;
  private _goalsByImportance: Record<ImportanceLevel, number>;
  private _goalsByCategory: Record<string, number>;
  private _goalsByStatus: Record<string, number>;
  private _goalsCreatedThisWeek: number;
  private _goalsCompletedThisWeek: number;
  private _goalsCreatedThisMonth: number;
  private _goalsCompletedThisMonth: number;
  private _totalReviews: number;
  private _averageRating: number;
  private _lastCalculatedAt: number;

  private constructor(params: {
    accountUuid: string;
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    archivedGoals: number;
    overdueGoals: number;
    totalKeyResults: number;
    completedKeyResults: number;
    averageProgress: number;
    goalsByImportance: Record<ImportanceLevel, number>;
    goalsByCategory: Record<string, number>;
    goalsByStatus: Record<string, number>;
    goalsCreatedThisWeek: number;
    goalsCompletedThisWeek: number;
    goalsCreatedThisMonth: number;
    goalsCompletedThisMonth: number;
    totalReviews: number;
    averageRating: number;
    lastCalculatedAt: number;
  }) {
    this._accountUuid = params.accountUuid;
    this._totalGoals = params.totalGoals;
    this._activeGoals = params.activeGoals;
    this._completedGoals = params.completedGoals;
    this._archivedGoals = params.archivedGoals;
    this._overdueGoals = params.overdueGoals;
    this._totalKeyResults = params.totalKeyResults;
    this._completedKeyResults = params.completedKeyResults;
    this._averageProgress = params.averageProgress;
    this._goalsByImportance = params.goalsByImportance;
    this._goalsByCategory = params.goalsByCategory;
    this._goalsByStatus = params.goalsByStatus;
    this._goalsCreatedThisWeek = params.goalsCreatedThisWeek;
    this._goalsCompletedThisWeek = params.goalsCompletedThisWeek;
    this._goalsCreatedThisMonth = params.goalsCreatedThisMonth;
    this._goalsCompletedThisMonth = params.goalsCompletedThisMonth;
    this._totalReviews = params.totalReviews;
    this._averageRating = params.averageRating;
    this._lastCalculatedAt = params.lastCalculatedAt;
  }

  // ===== Getters =====
  get accountUuid(): string {
    return this._accountUuid;
  }
  get totalGoals(): number {
    return this._totalGoals;
  }
  get activeGoals(): number {
    return this._activeGoals;
  }
  get completedGoals(): number {
    return this._completedGoals;
  }
  get archivedGoals(): number {
    return this._archivedGoals;
  }
  get overdueGoals(): number {
    return this._overdueGoals;
  }
  get totalKeyResults(): number {
    return this._totalKeyResults;
  }
  get completedKeyResults(): number {
    return this._completedKeyResults;
  }
  get averageProgress(): number {
    return this._averageProgress;
  }

  // ===== 工厂方法 =====

  /**
   * 创建空的统计对象
   */
  public static createEmpty(accountUuid: string): GoalStatistics {
    return new GoalStatistics({
      accountUuid,
      totalGoals: 0,
      activeGoals: 0,
      completedGoals: 0,
      archivedGoals: 0,
      overdueGoals: 0,
      totalKeyResults: 0,
      completedKeyResults: 0,
      averageProgress: 0,
      goalsByImportance: {
        Vital: 0,
        Important: 0,
        Moderate: 0,
        Minor: 0,
        Trivial: 0,
      } as Record<ImportanceLevel, number>,
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

  /**
   * 从持久化 DTO 重建
   */
  public static fromPersistenceDTO(dto: GoalStatisticsPersistenceDTO): GoalStatistics {
    return new GoalStatistics({
      accountUuid: dto.accountUuid,
      totalGoals: dto.totalGoals,
      activeGoals: dto.activeGoals,
      completedGoals: dto.completedGoals,
      archivedGoals: dto.archivedGoals,
      overdueGoals: dto.overdueGoals,
      totalKeyResults: dto.totalKeyResults,
      completedKeyResults: dto.completedKeyResults,
      averageProgress: dto.averageProgress,
      goalsByImportance: JSON.parse(dto.goalsByImportance || '{}'),
      goalsByCategory: JSON.parse(dto.goalsByCategory || '{}'),
      goalsByStatus: JSON.parse(dto.goalsByStatus || '{}'),
      goalsCreatedThisWeek: dto.goalsCreatedThisWeek,
      goalsCompletedThisWeek: dto.goalsCompletedThisWeek,
      goalsCreatedThisMonth: dto.goalsCreatedThisMonth,
      goalsCompletedThisMonth: dto.goalsCompletedThisMonth,
      totalReviews: dto.totalReviews,
      averageRating: dto.averageRating,
      lastCalculatedAt: dto.lastCalculatedAt,
    });
  }

  // ===== 事件处理器 =====

  /**
   * 处理目标创建事件
   */
  public onGoalCreated(_event: unknown): void {
    this._totalGoals++;
    this._activeGoals++;
    this._lastCalculatedAt = Date.now();
  }

  /**
   * 处理目标完成事件
   */
  public onGoalCompleted(_event: unknown): void {
    this._completedGoals++;
    this._activeGoals = Math.max(0, this._activeGoals - 1);
    this._lastCalculatedAt = Date.now();
  }

  // ===== DTO 转换 =====

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): GoalStatisticsPersistenceDTO {
    return {
      accountUuid: this._accountUuid,
      totalGoals: this._totalGoals,
      activeGoals: this._activeGoals,
      completedGoals: this._completedGoals,
      archivedGoals: this._archivedGoals,
      overdueGoals: this._overdueGoals,
      totalKeyResults: this._totalKeyResults,
      completedKeyResults: this._completedKeyResults,
      averageProgress: this._averageProgress,
      goalsByImportance: JSON.stringify(this._goalsByImportance),
      goalsByCategory: JSON.stringify(this._goalsByCategory),
      goalsByStatus: JSON.stringify(this._goalsByStatus),
      goalsCreatedThisWeek: this._goalsCreatedThisWeek,
      goalsCompletedThisWeek: this._goalsCompletedThisWeek,
      goalsCreatedThisMonth: this._goalsCreatedThisMonth,
      goalsCompletedThisMonth: this._goalsCompletedThisMonth,
      totalReviews: this._totalReviews,
      averageRating: this._averageRating,
      lastCalculatedAt: this._lastCalculatedAt,
    };
  }
}
