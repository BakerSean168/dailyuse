/**
 * GoalStatistics 聚合根实现
 * 实现 GoalStatisticsServer 接口
 *
 * DDD 聚合根职责：
 * - 管理目标统计数据的计算和更新
 * - 提供统计分析相关的业务逻辑
 * - 确保统计数据的一致性
 */

import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { AggregateRoot } from '@dailyuse/utils';
import type {
  GoalServerDTO,
  GoalStatisticsClientDTO,
  GoalStatisticsPersistenceDTO,
  GoalStatisticsRecalculatedEvent,
  GoalStatisticsServer,
  GoalStatisticsServerDTO,
  GoalStatisticsUpdateEvent,
  TrendType,
} from '@dailyuse/contracts/goal';

// 类型别名

/**
 * GoalStatistics 聚合根
 */
export class GoalStatistics extends AggregateRoot implements GoalStatisticsServer {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _totalGoals: number;
  private _activeGoals: number;
  private _completedGoals: number;
  private _archivedGoals: number;
  private _overdueGoals: number;
  private _totalKeyResults: number;
  private _completedKeyResults: number;
  private _averageProgress: number;
  private _goalsByImportance: Record<string, number>;
  private _goalsByCategory: Record<string, number>;
  private _goalsByStatus: Record<string, number>;
  private _goalsCreatedThisWeek: number;
  private _goalsCompletedThisWeek: number;
  private _goalsCreatedThisMonth: number;
  private _goalsCompletedThisMonth: number;
  private _totalReviews: number;
  private _averageRating: number | null;
  private _lastCalculatedAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    accountUuid: string;
    totalGoals?: number;
    activeGoals?: number;
    completedGoals?: number;
    archivedGoals?: number;
    overdueGoals?: number;
    totalKeyResults?: number;
    completedKeyResults?: number;
    averageProgress?: number;
    goalsByImportance?: Record<string, number>;
    goalsByCategory?: Record<string, number>;
    goalsByStatus?: Record<string, number>;
    goalsCreatedThisWeek?: number;
    goalsCompletedThisWeek?: number;
    goalsCreatedThisMonth?: number;
    goalsCompletedThisMonth?: number;
    totalReviews?: number;
    averageRating?: number | null;
    lastCalculatedAt?: number;
  }) {
    super(params.accountUuid); // 使用 accountUuid 作为聚合根 ID
    this._accountUuid = params.accountUuid;
    this._totalGoals = params.totalGoals ?? 0;
    this._activeGoals = params.activeGoals ?? 0;
    this._completedGoals = params.completedGoals ?? 0;
    this._archivedGoals = params.archivedGoals ?? 0;
    this._overdueGoals = params.overdueGoals ?? 0;
    this._totalKeyResults = params.totalKeyResults ?? 0;
    this._completedKeyResults = params.completedKeyResults ?? 0;
    this._averageProgress = params.averageProgress ?? 0;
    this._goalsByImportance = params.goalsByImportance ?? {};
    this._goalsByCategory = params.goalsByCategory ?? {};
    this._goalsByStatus = params.goalsByStatus ?? {};
    this._goalsCreatedThisWeek = params.goalsCreatedThisWeek ?? 0;
    this._goalsCompletedThisWeek = params.goalsCompletedThisWeek ?? 0;
    this._goalsCreatedThisMonth = params.goalsCreatedThisMonth ?? 0;
    this._goalsCompletedThisMonth = params.goalsCompletedThisMonth ?? 0;
    this._totalReviews = params.totalReviews ?? 0;
    this._averageRating = params.averageRating ?? null;
    this._lastCalculatedAt = params.lastCalculatedAt ?? Date.now();
  }

  // ===== Getter 属性 =====
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get totalGoals(): number {
    return this._totalGoals;
  }
  public get activeGoals(): number {
    return this._activeGoals;
  }
  public get completedGoals(): number {
    return this._completedGoals;
  }
  public get archivedGoals(): number {
    return this._archivedGoals;
  }
  public get overdueGoals(): number {
    return this._overdueGoals;
  }
  public get totalKeyResults(): number {
    return this._totalKeyResults;
  }
  public get completedKeyResults(): number {
    return this._completedKeyResults;
  }
  public get averageProgress(): number {
    return this._averageProgress;
  }
  public get goalsByImportance(): Record<string, number> {
    return { ...this._goalsByImportance };
  }
  public get goalsByCategory(): Record<string, number> {
    return { ...this._goalsByCategory };
  }
  public get goalsByStatus(): Record<string, number> {
    return { ...this._goalsByStatus };
  }
  public get goalsCreatedThisWeek(): number {
    return this._goalsCreatedThisWeek;
  }
  public get goalsCompletedThisWeek(): number {
    return this._goalsCompletedThisWeek;
  }
  public get goalsCreatedThisMonth(): number {
    return this._goalsCreatedThisMonth;
  }
  public get goalsCompletedThisMonth(): number {
    return this._goalsCompletedThisMonth;
  }
  public get totalReviews(): number {
    return this._totalReviews;
  }
  public get averageRating(): number | null {
    return this._averageRating;
  }
  public get lastCalculatedAt(): number {
    return this._lastCalculatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的默认 GoalStatistics 聚合根
   */
  public static createDefault(accountUuid: string): GoalStatistics {
    if (!accountUuid) {
      throw new Error('Account UUID is required');
    }

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
      goalsByImportance: {},
      goalsByCategory: {},
      goalsByStatus: {},
      goalsCreatedThisWeek: 0,
      goalsCompletedThisWeek: 0,
      goalsCreatedThisMonth: 0,
      goalsCompletedThisMonth: 0,
      totalReviews: 0,
      averageRating: null,
      lastCalculatedAt: Date.now(),
    });
  }

  /**
   * 创建空统计（与 createDefault 相同，用于兼容性）
   */
  public static createEmpty(accountUuid: string): GoalStatistics {
    return GoalStatistics.createDefault(accountUuid);
  }

  /**
   * 从 Server DTO 重建聚合根
   */
  public static fromServerDTO(dto: GoalStatisticsServerDTO): GoalStatistics {
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
      goalsByImportance: dto.goalsByImportance,
      goalsByCategory: dto.goalsByCategory,
      goalsByStatus: dto.goalsByStatus,
      goalsCreatedThisWeek: dto.goalsCreatedThisWeek,
      goalsCompletedThisWeek: dto.goalsCompletedThisWeek,
      goalsCreatedThisMonth: dto.goalsCreatedThisMonth,
      goalsCompletedThisMonth: dto.goalsCompletedThisMonth,
      totalReviews: dto.totalReviews,
      averageRating: dto.averageRating ?? null,
      lastCalculatedAt: dto.lastCalculatedAt,
    });
  }

  /**
   * 从持久化 DTO 重建聚合根
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
      goalsByImportance: JSON.parse(dto.goalsByImportance) as Record<string, number>,
      goalsByCategory: JSON.parse(dto.goalsByCategory) as Record<string, number>,
      goalsByStatus: JSON.parse(dto.goalsByStatus) as Record<string, number>,
      goalsCreatedThisWeek: dto.goalsCreatedThisWeek,
      goalsCompletedThisWeek: dto.goalsCompletedThisWeek,
      goalsCreatedThisMonth: dto.goalsCreatedThisMonth,
      goalsCompletedThisMonth: dto.goalsCompletedThisMonth,
      totalReviews: dto.totalReviews,
      averageRating: dto.averageRating ?? null,
      lastCalculatedAt: dto.lastCalculatedAt,
    });
  }

  // ===== 业务方法 =====

  /**
   * 重新计算统计数据
   * @param goals 所有目标列表
   */
  public recalculate(goals: GoalServerDTO[]): void {
    const previousStatistics = this.toServerDTO();
    const now = Date.now();
    const weekStart = this.getWeekStart(now);
    const monthStart = this.getMonthStart(now);

    // 重置所有计数器
    this._totalGoals = 0;
    this._activeGoals = 0;
    this._completedGoals = 0;
    this._archivedGoals = 0;
    this._overdueGoals = 0;
    this._totalKeyResults = 0;
    this._completedKeyResults = 0;
    this._goalsByImportance = {};
    this._goalsByCategory = {};
    this._goalsByStatus = {};
    this._goalsCreatedThisWeek = 0;
    this._goalsCompletedThisWeek = 0;
    this._goalsCreatedThisMonth = 0;
    this._goalsCompletedThisMonth = 0;
    this._totalReviews = 0;

    let totalProgress = 0;
    let totalRating = 0;
    let ratingCount = 0;

    // 遍历所有目标进行统计
    for (const goal of goals) {
      // 跳过已删除的目标
      if (goal.deletedAt) continue;

      // 总目标数
      this._totalGoals++;

      // 按状态统计
      this._goalsByStatus[goal.status] = (this._goalsByStatus[goal.status] || 0) + 1;

      if (goal.status === 'ACTIVE') {
        this._activeGoals++;
      } else if (goal.status === 'COMPLETED') {
        this._completedGoals++;
      }

      // 归档目标
      if (goal.archivedAt) {
        this._archivedGoals++;
      }

      // 逾期目标
      if (goal.targetDate && goal.targetDate < now && goal.status !== 'COMPLETED') {
        this._overdueGoals++;
      }

      // 按重要性统计
      this._goalsByImportance[goal.importance] =
        (this._goalsByImportance[goal.importance] || 0) + 1;

      // 按紧急性统计 - REMOVED: urgency 字段已移除
      // this._goalsByUrgency[goal.urgency] = (this._goalsByUrgency[goal.urgency] || 0) + 1;

      // 按分类统计
      if (goal.category) {
        this._goalsByCategory[goal.category] = (this._goalsByCategory[goal.category] || 0) + 1;
      }

      // 本周创建的目标
      if (goal.createdAt >= weekStart) {
        this._goalsCreatedThisWeek++;
      }

      // 本周完成的目标
      if (goal.completedAt && goal.completedAt >= weekStart) {
        this._goalsCompletedThisWeek++;
      }

      // 本月创建的目标
      if (goal.createdAt >= monthStart) {
        this._goalsCreatedThisMonth++;
      }

      // 本月完成的目标
      if (goal.completedAt && goal.completedAt >= monthStart) {
        this._goalsCompletedThisMonth++;
      }

      // 关键结果统计
      if (goal.keyResults && goal.keyResults.length > 0) {
        this._totalKeyResults += goal.keyResults.length;
        for (const kr of goal.keyResults) {
          // 判断是否完成
          if (kr.progress.currentValue >= kr.progress.targetValue) {
            this._completedKeyResults++;
          }
          // 计算并累加进度百分比
          const targetValue = kr.progress.targetValue;
          const currentValue = kr.progress.currentValue;
          const percentage =
            targetValue === 0 ? 0 : Math.min(Math.max((currentValue / targetValue) * 100, 0), 100);
          totalProgress += percentage;
        }
      }

      // 回顾统计
      if (goal.reviews && goal.reviews.length > 0) {
        this._totalReviews += goal.reviews.length;
        for (const review of goal.reviews) {
          totalRating += review.rating;
          ratingCount++;
        }
      }
    }

    // 计算平均进度
    this._averageProgress = this._totalKeyResults > 0 ? totalProgress / this._totalKeyResults : 0;

    // 计算平均评分
    this._averageRating = ratingCount > 0 ? totalRating / ratingCount : null;

    // 更新计算时间
    this._lastCalculatedAt = now;

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'goal_statistics.recalculated',
      aggregateId: this._accountUuid,
      occurredOn: new Date(now),
      accountUuid: this._accountUuid,
      payload: {
        statistics: this.toServerDTO(),
        previousStatistics,
      },
    });
  }

  /**
   * 获取完成率（已完成目标 / 总目标）
   */
  public getCompletionRate(): number {
    if (this._totalGoals === 0) return 0;
    return (this._completedGoals / this._totalGoals) * 100;
  }

  /**
   * 获取平均每月目标数
   * 注意：这是一个简化实现，实际应该基于账户创建时间来计算
   */
  public getAverageGoalsPerMonth(): number {
    // 简化实现：假设统计的是当前月份
    return this._goalsCreatedThisMonth;
  }

  // ===== 辅助方法 =====

  /**
   * 获取本周开始时间戳（周一 00:00:00）
   */
  private getWeekStart(timestamp: number): number {
    const date = new Date(timestamp);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 调整到周一
    const weekStart = new Date(date.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart.getTime();
  }

  /**
   * 获取本月开始时间戳（1号 00:00:00）
   */
  private getMonthStart(timestamp: number): number {
    const date = new Date(timestamp);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    return monthStart.getTime();
  }

  // ===== DTO 转换 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): GoalStatisticsServerDTO {
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
      goalsByImportance: { ...this._goalsByImportance },
      goalsByCategory: { ...this._goalsByCategory },
      goalsByStatus: { ...this._goalsByStatus },
      goalsCreatedThisWeek: this._goalsCreatedThisWeek,
      goalsCompletedThisWeek: this._goalsCompletedThisWeek,
      goalsCreatedThisMonth: this._goalsCreatedThisMonth,
      goalsCompletedThisMonth: this._goalsCompletedThisMonth,
      totalReviews: this._totalReviews,
      averageRating: this._averageRating,
      lastCalculatedAt: this._lastCalculatedAt,
    };
  }

  public toClientDTO(): GoalStatisticsClientDTO {
    const completionRate =
      this._totalGoals > 0 ? (this._completedGoals / this._totalGoals) * 100 : 0;
    const keyResultCompletionRate =
      this._totalKeyResults > 0 ? (this._completedKeyResults / this._totalKeyResults) * 100 : 0;
    const overdueRate = this._totalGoals > 0 ? (this._overdueGoals / this._totalGoals) * 100 : 0;

    const getTrend = (created: number, completed: number): TrendType => {
      if (completed > created) return 'UP';
      if (completed < created) return 'DOWN';
      return 'STABLE';
    };

    const weeklyTrend = getTrend(this._goalsCreatedThisWeek, this._goalsCompletedThisWeek);
    const monthlyTrend = getTrend(this._goalsCreatedThisMonth, this._goalsCompletedThisMonth);

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
      goalsByImportance: { ...this._goalsByImportance },
      goalsByCategory: { ...this._goalsByCategory },
      goalsByStatus: { ...this._goalsByStatus },
      goalsCreatedThisWeek: this._goalsCreatedThisWeek,
      goalsCompletedThisWeek: this._goalsCompletedThisWeek,
      goalsCreatedThisMonth: this._goalsCreatedThisMonth,
      goalsCompletedThisMonth: this._goalsCompletedThisMonth,
      totalReviews: this._totalReviews,
      averageRating: this._averageRating,
      lastCalculatedAt: this._lastCalculatedAt,

      // UI 计算字段
      completionRate,
      keyResultCompletionRate,
      overdueRate,
      weeklyTrend,
      monthlyTrend,
    };
  }

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

  // ===== 事件处理方法（增量更新） =====

  /**
   * 处理目标创建事件
   */
  public onGoalCreated(event: GoalStatisticsUpdateEvent): void {
    this._totalGoals++;

    // 更新按重要性统计
    if (event.payload.importance) {
      const key = event.payload.importance;
      this._goalsByImportance[key] = (this._goalsByImportance[key] || 0) + 1;
    }

    // 更新按分类统计
    if (event.payload.category) {
      const category = event.payload.category;
      this._goalsByCategory[category] = (this._goalsByCategory[category] || 0) + 1;
    }

    // 更新按状态统计
    if (event.payload.newStatus) {
      const status = event.payload.newStatus;
      this._goalsByStatus[status] = (this._goalsByStatus[status] || 0) + 1;

      if (status === 'ACTIVE') {
        this._activeGoals++;
      }
    }

    // 检查是否在本周/本月创建
    const weekStart = this.getWeekStart(Date.now());
    const monthStart = this.getMonthStart(Date.now());

    if (event.timestamp >= weekStart) {
      this._goalsCreatedThisWeek++;
    }

    if (event.timestamp >= monthStart) {
      this._goalsCreatedThisMonth++;
    }

    this._lastCalculatedAt = Date.now();
  }

  /**
   * 处理目标删除事件
   */
  public onGoalDeleted(event: GoalStatisticsUpdateEvent): void {
    this._totalGoals = Math.max(0, this._totalGoals - 1);

    // 更新按重要性统计
    if (event.payload.importance) {
      const key = event.payload.importance;
      this._goalsByImportance[key] = Math.max(0, (this._goalsByImportance[key] || 0) - 1);
    }

    // 更新按分类统计
    if (event.payload.category) {
      const category = event.payload.category;
      this._goalsByCategory[category] = Math.max(0, (this._goalsByCategory[category] || 0) - 1);
    }

    // 更新按状态统计
    if (event.payload.previousStatus) {
      const status = event.payload.previousStatus;
      this._goalsByStatus[status] = Math.max(0, (this._goalsByStatus[status] || 0) - 1);

      if (status === 'ACTIVE') {
        this._activeGoals = Math.max(0, this._activeGoals - 1);
      } else if (status === 'COMPLETED') {
        this._completedGoals = Math.max(0, this._completedGoals - 1);
      } else if (status === 'ARCHIVED') {
        this._archivedGoals = Math.max(0, this._archivedGoals - 1);
      }
    }

    this._lastCalculatedAt = Date.now();
  }

  /**
   * 处理目标状态变更事件
   */
  public onGoalStatusChanged(event: GoalStatisticsUpdateEvent): void {
    const { previousStatus, newStatus } = event.payload;

    if (!previousStatus || !newStatus) return;

    // 减少旧状态计数
    this._goalsByStatus[previousStatus] = Math.max(
      0,
      (this._goalsByStatus[previousStatus] || 0) - 1,
    );
    if (previousStatus === 'ACTIVE') {
      this._activeGoals = Math.max(0, this._activeGoals - 1);
    } else if (previousStatus === 'COMPLETED') {
      this._completedGoals = Math.max(0, this._completedGoals - 1);
    }

    // 增加新状态计数
    this._goalsByStatus[newStatus] = (this._goalsByStatus[newStatus] || 0) + 1;
    if (newStatus === 'ACTIVE') {
      this._activeGoals++;
    } else if (newStatus === 'COMPLETED') {
      this._completedGoals++;
    }

    this._lastCalculatedAt = Date.now();
  }

  /**
   * 处理目标完成事件
   */
  public onGoalCompleted(event: GoalStatisticsUpdateEvent): void {
    // 目标从 ACTIVE 状态变为 COMPLETED
    this._activeGoals = Math.max(0, this._activeGoals - 1);
    this._completedGoals++;

    // 检查是否在本周/本月完成
    const weekStart = this.getWeekStart(Date.now());
    const monthStart = this.getMonthStart(Date.now());

    if (event.timestamp >= weekStart) {
      this._goalsCompletedThisWeek++;
    }

    if (event.timestamp >= monthStart) {
      this._goalsCompletedThisMonth++;
    }

    this._lastCalculatedAt = Date.now();
  }

  /**
   * 处理目标归档事件
   */
  public onGoalArchived(event: GoalStatisticsUpdateEvent): void {
    this._archivedGoals++;
    this._lastCalculatedAt = Date.now();
  }

  /**
   * 处理目标激活事件
   */
  public onGoalActivated(event: GoalStatisticsUpdateEvent): void {
    this._activeGoals++;
    this._lastCalculatedAt = Date.now();
  }

  /**
   * 处理关键结果创建事件
   */
  public onKeyResultCreated(event: GoalStatisticsUpdateEvent): void {
    const count = event.payload.keyResultCount || 1;
    this._totalKeyResults += count;
    this._lastCalculatedAt = Date.now();
  }

  /**
   * 处理关键结果删除事件
   */
  public onKeyResultDeleted(event: GoalStatisticsUpdateEvent): void {
    const count = event.payload.keyResultCount || 1;
    this._totalKeyResults = Math.max(0, this._totalKeyResults - count);
    this._lastCalculatedAt = Date.now();
  }

  /**
   * 处理关键结果完成事件
   */
  public onKeyResultCompleted(event: GoalStatisticsUpdateEvent): void {
    this._completedKeyResults++;
    this._lastCalculatedAt = Date.now();
  }

  /**
   * 处理回顾创建事件
   */
  public onReviewCreated(event: GoalStatisticsUpdateEvent): void {
    this._totalReviews++;

    // 更新平均评分
    if (event.payload.rating !== undefined) {
      const currentTotal = (this._averageRating || 0) * (this._totalReviews - 1);
      const newTotal = currentTotal + event.payload.rating;
      this._averageRating = newTotal / this._totalReviews;
    }

    this._lastCalculatedAt = Date.now();
  }

  /**
   * 处理回顾删除事件
   */
  public onReviewDeleted(event: GoalStatisticsUpdateEvent): void {
    this._totalReviews = Math.max(0, this._totalReviews - 1);

    // 更新平均评分
    if (event.payload.rating !== undefined && this._averageRating !== null) {
      if (this._totalReviews === 0) {
        this._averageRating = null;
      } else {
        const currentTotal = this._averageRating * (this._totalReviews + 1);
        const newTotal = currentTotal - event.payload.rating;
        this._averageRating = newTotal / this._totalReviews;
      }
    }

    this._lastCalculatedAt = Date.now();
  }

  /**
   * 处理专注会话完成事件
   */
  public onFocusSessionCompleted(event: GoalStatisticsUpdateEvent): void {
    if (event.payload.focusMinutes) {
      // 这里可以添加专注会话相关的统计
      // 目前 GoalStatistics 没有专注会话字段，可以后续扩展
    }
    this._lastCalculatedAt = Date.now();
  }
}
