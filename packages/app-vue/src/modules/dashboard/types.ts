import type { Result } from '@dailyuse/contracts/result';
export type {
  DashboardStats,
  ActivityItem,
  TrendDay,
  GoalProgressItem,
  TaskBoardSummary,
  ScheduleItem,
  DashboardData,
} from '@dailyuse/contracts/dashboard';
import type { DashboardData } from '@dailyuse/contracts/dashboard';

// ── Port Interface ──

export interface IDashboardApiClient {
  getDashboardStats(): Promise<Result<DashboardData>>;
}
