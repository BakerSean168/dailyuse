/**
 * GoalStatistics Aggregate Root - Client Implementation
 * 目标统计聚合根 - 客户端实现
 */

import { AggregateRoot } from '@dailyuse/utils';
import type { TrendType } from '@dailyuse/contracts/goal';
import type {
  ChartData,
  GoalStatisticsClient,
  GoalStatisticsClientDTO,
  GoalStatisticsServerDTO,
  TimelineData,
} from '@dailyuse/contracts/goal';

/**
 * 目标统计聚合根客户端实现
 */
export class GoalStatistics
  extends AggregateRoot
  implements GoalStatisticsClient
{
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
  private _averageRating?: number | null;
  private _lastCalculatedAt: number;

  private constructor(
    accountUuid: string,
    totalGoals: number,
    activeGoals: number,
    completedGoals: number,
    archivedGoals: number,
    overdueGoals: number,
    totalKeyResults: number,
    completedKeyResults: number,
    averageProgress: number,
    goalsByImportance: Record<string, number>,
    goalsByCategory: Record<string, number>,
    goalsByStatus: Record<string, number>,
    goalsCreatedThisWeek: number,
    goalsCompletedThisWeek: number,
    goalsCreatedThisMonth: number,
    goalsCompletedThisMonth: number,
    totalReviews: number,
    averageRating: number | null | undefined,
    lastCalculatedAt: number,
  ) {
    super(accountUuid); // 使用 accountUuid 作为聚合根的 uuid
    this._accountUuid = accountUuid;
    this._totalGoals = totalGoals;
    this._activeGoals = activeGoals;
    this._completedGoals = completedGoals;
    this._archivedGoals = archivedGoals;
    this._overdueGoals = overdueGoals;
    this._totalKeyResults = totalKeyResults;
    this._completedKeyResults = completedKeyResults;
    this._averageProgress = averageProgress;
    this._goalsByImportance = goalsByImportance;
    this._goalsByCategory = goalsByCategory;
    this._goalsByStatus = goalsByStatus;
    this._goalsCreatedThisWeek = goalsCreatedThisWeek;
    this._goalsCompletedThisWeek = goalsCompletedThisWeek;
    this._goalsCreatedThisMonth = goalsCreatedThisMonth;
    this._goalsCompletedThisMonth = goalsCompletedThisMonth;
    this._totalReviews = totalReviews;
    this._averageRating = averageRating;
    this._lastCalculatedAt = lastCalculatedAt;
  }

  // ========== Getters ==========

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

  get goalsByImportance(): Record<string, number> {
    return { ...this._goalsByImportance };
  }

  get goalsByCategory(): Record<string, number> {
    return { ...this._goalsByCategory };
  }

  get goalsByStatus(): Record<string, number> {
    return { ...this._goalsByStatus };
  }

  get goalsCreatedThisWeek(): number {
    return this._goalsCreatedThisWeek;
  }

  get goalsCompletedThisWeek(): number {
    return this._goalsCompletedThisWeek;
  }

  get goalsCreatedThisMonth(): number {
    return this._goalsCreatedThisMonth;
  }

  get goalsCompletedThisMonth(): number {
    return this._goalsCompletedThisMonth;
  }

  get totalReviews(): number {
    return this._totalReviews;
  }

  get averageRating(): number | null | undefined {
    return this._averageRating;
  }

  get lastCalculatedAt(): number {
    return this._lastCalculatedAt;
  }

  // ========== UI 计算属性 ==========

  get completionRate(): number {
    if (this._totalGoals === 0) return 0;
    return Math.round((this._completedGoals / this._totalGoals) * 100);
  }

  get keyResultCompletionRate(): number {
    if (this._totalKeyResults === 0) return 0;
    return Math.round((this._completedKeyResults / this._totalKeyResults) * 100);
  }

  get overdueRate(): number {
    if (this._activeGoals === 0) return 0;
    return Math.round((this._overdueGoals / this._activeGoals) * 100);
  }

  get weeklyTrend(): TrendType {
    if (this._goalsCompletedThisWeek > this._goalsCreatedThisWeek) {
      return 'DOWN'; // 完成的多，说明目标数量在减少（好事）
    } else if (this._goalsCreatedThisWeek > this._goalsCompletedThisWeek) {
      return 'UP'; // 创建的多，目标数量在增加
    }
    return 'STABLE';
  }

  get monthlyTrend(): TrendType {
    if (this._goalsCompletedThisMonth > this._goalsCreatedThisMonth) {
      return 'DOWN';
    } else if (this._goalsCreatedThisMonth > this._goalsCompletedThisMonth) {
      return 'UP';
    }
    return 'STABLE';
  }

  // ========== UI 业务方法 ==========

  getCompletionText(): string {
    const completed = this._completedGoals;
    const total = this._totalGoals;
    const rate = this.completionRate;
    return `${completed}/${total} (${rate}%)`;
  }

  getOverdueText(): string {
    if (this._overdueGoals === 0) {
      return '无逾期目标';
    }
    return `${this._overdueGoals} 个逾期 (${this.overdueRate}%)`;
  }

  getTrendIndicator(): { icon: string; color: string; text: string } {
    const trend = this.weeklyTrend;
    const indicators: Record<TrendType, { icon: string; color: string; text: string }> = {
      UP: { icon: '📈', color: '#EF4444', text: '上升' },
      DOWN: { icon: '📉', color: '#10B981', text: '下降' },
      STABLE: { icon: '➡️', color: '#94A3B8', text: '稳定' },
    };
    return indicators[trend];
  }

  getTopCategory(): string | null {
    const entries = Object.entries(this._goalsByCategory);
    if (entries.length === 0) return null;

    const [category] = entries.reduce((max, entry) => (entry[1] > max[1] ? entry : max));
    return category;
  }

  // ========== 图表数据方法 ==========

  getImportanceChartData(): ChartData {
    const labels = Object.keys(this._goalsByImportance);
    const values = Object.values(this._goalsByImportance);
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#6B7280'];

    return {
      labels,
      datasets: [
        {
          label: 'Goals by Importance',
          data: values,
          backgroundColor: colors,
        },
      ],
    };
  }

  getStatusChartData(): ChartData {
    const labels = Object.keys(this._goalsByStatus);
    const values = Object.values(this._goalsByStatus);
    const colors = ['#3B82F6', '#10B981', '#94A3B8', '#F59E0B'];

    return {
      labels,
      datasets: [
        {
          label: 'Goals by Status',
          data: values,
          backgroundColor: colors,
        },
      ],
    };
  }

  getProgressChartData(): ChartData {
    const ranges = ['0-25%', '26-50%', '51-75%', '76-100%'];
    const values = [0, 0, 0, 0];

    // 这里需要根据实际的目标进度数据来分组
    // 目前使用平均进度作为简单示例
    const avgProgress = this._averageProgress;
    if (avgProgress <= 25) values[0] = this._activeGoals;
    else if (avgProgress <= 50) values[1] = this._activeGoals;
    else if (avgProgress <= 75) values[2] = this._activeGoals;
    else values[3] = this._activeGoals;

    const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

    return {
      labels: ranges,
      datasets: [
        {
          label: 'Goals by Progress',
          data: values,
          backgroundColor: colors,
        },
      ],
    };
  }

  getTimelineChartData(): TimelineData {
    // 生成最近7天的日期
    const dates: string[] = [];
    const created: number[] = [];
    const completed: number[] = [];

    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);

      // 这里需要根据实际的每日数据来填充
      // 目前使用简单的平均值作为示例
      created.push(Math.round(this._goalsCreatedThisWeek / 7));
      completed.push(Math.round(this._goalsCompletedThisWeek / 7));
    }

    return { dates, created, completed };
  }

  // ========== DTO 转换 ==========

  toServerDTO(): GoalStatisticsServerDTO {
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
      goalsByImportance: this._goalsByImportance,
      goalsByCategory: this._goalsByCategory,
      goalsByStatus: this._goalsByStatus,
      goalsCreatedThisWeek: this._goalsCreatedThisWeek,
      goalsCompletedThisWeek: this._goalsCompletedThisWeek,
      goalsCreatedThisMonth: this._goalsCreatedThisMonth,
      goalsCompletedThisMonth: this._goalsCompletedThisMonth,
      totalReviews: this._totalReviews,
      averageRating: this._averageRating,
      lastCalculatedAt: this._lastCalculatedAt,
    };
  }

  toClientDTO(): GoalStatisticsClientDTO {
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
      goalsByImportance: this._goalsByImportance,
      goalsByCategory: this._goalsByCategory,
      goalsByStatus: this._goalsByStatus,
      goalsCreatedThisWeek: this._goalsCreatedThisWeek,
      goalsCompletedThisWeek: this._goalsCompletedThisWeek,
      goalsCreatedThisMonth: this._goalsCreatedThisMonth,
      goalsCompletedThisMonth: this._goalsCompletedThisMonth,
      totalReviews: this._totalReviews,
      averageRating: this._averageRating,
      lastCalculatedAt: this._lastCalculatedAt,
      completionRate: this.completionRate,
      keyResultCompletionRate: this.keyResultCompletionRate,
      overdueRate: this.overdueRate,
      weeklyTrend: this.weeklyTrend,
      monthlyTrend: this.monthlyTrend,
    };
  }

  // ========== 静态工厂方法 ==========

  static createDefault(accountUuid: string): GoalStatistics {
    const now = Date.now();

    return new GoalStatistics(
      accountUuid,
      0, // totalGoals
      0, // activeGoals
      0, // completedGoals
      0, // archivedGoals
      0, // overdueGoals
      0, // totalKeyResults
      0, // completedKeyResults
      0, // averageProgress
      {}, // goalsByImportance
      {}, // goalsByCategory
      {}, // goalsByStatus
      0, // goalsCreatedThisWeek
      0, // goalsCompletedThisWeek
      0, // goalsCreatedThisMonth
      0, // goalsCompletedThisMonth
      0, // totalReviews
      null, // averageRating
      now, // lastCalculatedAt
    );
  }

  static fromServerDTO(dto: GoalStatisticsServerDTO): GoalStatistics {
    return new GoalStatistics(
      dto.accountUuid,
      dto.totalGoals,
      dto.activeGoals,
      dto.completedGoals,
      dto.archivedGoals,
      dto.overdueGoals,
      dto.totalKeyResults,
      dto.completedKeyResults,
      dto.averageProgress,
      dto.goalsByImportance,
      dto.goalsByCategory,
      dto.goalsByStatus,
      dto.goalsCreatedThisWeek,
      dto.goalsCompletedThisWeek,
      dto.goalsCreatedThisMonth,
      dto.goalsCompletedThisMonth,
      dto.totalReviews,
      dto.averageRating,
      dto.lastCalculatedAt,
    );
  }

  static fromClientDTO(dto: GoalStatisticsClientDTO): GoalStatistics {
    return new GoalStatistics(
      dto.accountUuid,
      dto.totalGoals,
      dto.activeGoals,
      dto.completedGoals,
      dto.archivedGoals,
      dto.overdueGoals,
      dto.totalKeyResults,
      dto.completedKeyResults,
      dto.averageProgress,
      dto.goalsByImportance,
      dto.goalsByCategory,
      dto.goalsByStatus,
      dto.goalsCreatedThisWeek,
      dto.goalsCompletedThisWeek,
      dto.goalsCreatedThisMonth,
      dto.goalsCompletedThisMonth,
      dto.totalReviews,
      dto.averageRating,
      dto.lastCalculatedAt,
    );
  }
}
