import type { TransferDate, DomainDate, PersistenceDate } from '@/primitives';

// ============ 统计子信息接口 ============

/**
 * 实例统计信息
 */
export interface InstanceStatsInfo {
  totalInstances: number;
  todayInstances: number;
  weekInstances: number;
  monthInstances: number;
  pendingInstances: number;
  inProgressInstances: number;
  completedInstances: number;
  skippedInstances: number;
  expiredInstances: number;
}

/**
 * 完成统计信息
 */
export interface CompletionStatsInfo {
  todayCompleted: number;
  weekCompleted: number;
  monthCompleted: number;
  totalCompleted: number;
  averageCompletionTime: number | null;
  completionRate: number;
}

/**
 * 时间统计信息
 */
export interface TimeStatsInfo {
  allDayTasks: number;
  timePointTasks: number;
  timeRangeTasks: number;
  overdueInstances: number;
  upcomingInstances: number;
}

/**
 * 分布统计信息
 */
export interface DistributionStatsInfo {
  tasksByImportance: Record<string, number>;
  tasksByUrgency: Record<string, number>;
  tasksByFolder: Record<string, number>;
  tasksByTag: Record<string, number>;
}

/**
 * Template statistics info
 */
export interface TemplateStatsInfo {
  totalTemplates: number;
  activeTemplates: number;
  pausedTemplates: number;
  archivedTemplates: number;
  oneTimeTemplates: number;
  recurringTemplates: number;
}

// ============ DTO 定义 ============

/**
 * Task Statistics DTO (传输层)
 */
export interface TaskStatisticsDTO {
  templateStats: TemplateStatsInfo;
  instanceStats: InstanceStatsInfo;
  completionStats: CompletionStatsInfo;
  timeStats: TimeStatsInfo;
  distributionStats: DistributionStatsInfo;
  calculatedAt: TransferDate;
  // UI 显示文本
  todayCompletionText: string;
  weekCompletionText: string;
  completionRateText: string;
  overdueText: string;
  efficiencyTrendText: string;
  // 图表数据
  chartData?: ChartData;
  trendData?: TrendData;
}

/**
 * 图表数据
 */
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

/**
 * 趋势数据
 */
export interface TrendData {
  period: 'daily' | 'weekly' | 'monthly';
  completionTrend: number[];
  efficiencyTrend: number[];
  timestamps: number[];
}
