export interface GoalStatisticsClientDTO {
  identityId: string;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  archivedGoals: number;
  overdueGoals: number;
  totalKeyResults: number;
  completedKeyResults: number;
  averageProgress: number;
  goalsByImportance: Record<string, number>;
  // goalsByUrgency: Record<string, number>; // REMOVED
  goalsByCategory: Record<string, number>;
  goalsByStatus: Record<string, number>;
  goalsCreatedThisWeek: number;
  goalsCompletedThisWeek: number;
  goalsCreatedThisMonth: number;
  goalsCompletedThisMonth: number;
  totalReviews: number;
  averageRating: number | null;
  lastCalculatedAt: TransferDate;

  // UI 计算字段
  completionRate: number; // 完成率 0-100
  keyResultCompletionRate: number; // 关键结果完成率 0-100
  overdueRate: number; // 逾期率 0-100
  weeklyTrend: TrendType;
  monthlyTrend: TrendType;

  
}
