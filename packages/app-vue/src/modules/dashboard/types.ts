import type { Result } from '@dailyuse/contracts/result';

// ── DTO Types ──

export interface DashboardStats {
  activeTasks: number;
  completedToday: number;
  activeGoals: number;
  upcomingReminders: number;
  unreadNotifications: number;
  scheduleConflicts: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: number;
}

export interface TrendDay {
  date: string;
  tasksCompleted: number;
  tasksCreated: number;
  focusMinutes: number;
}

export interface GoalProgressItem {
  id: string;
  name: string;
  progress: number;
  status: string;
  dueDate: number;
  keyResultCount: number;
}

export interface TaskBoardSummary {
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}

export interface ScheduleItem {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  priority: number;
}

export interface DashboardData {
  stats: DashboardStats;
  activityTimeline: ActivityItem[];
  trendDays: TrendDay[];
  goalProgress: GoalProgressItem[];
  taskBoard: TaskBoardSummary;
  upcomingSchedule: ScheduleItem[];
}

// ── Port Interface ──

export interface IDashboardApiClient {
  getDashboardStats(): Promise<Result<DashboardData>>;
}
