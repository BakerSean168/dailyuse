import type { TransferDate } from '@/primitives';

export interface TaskStatisticsDTO {

  templateStats: TemplateStatsInfo;
  instanceStats: InstanceStatsInfo;
  completionStats: CompletionStatsInfo;
  timeStats: TimeStatsInfo;
  distributionStats: DistributionStatsInfo;
  calculatedAt: TransferDate;

  // UI 扩展
  todayCompletionText: string;
  weekCompletionText: string;
  completionRateText: string;
  overdueText: string;
  efficiencyTrendText: string;
}



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
  averageCompletionTime: number | null; // 平均完成时间（毫秒）
  completionRate: number; // 完成�?0-100
}

/**
 * 时间统计信息
 */
export interface TimeStatsInfo {
  allDayTasks: number;
  timePointTasks: number;
  timeRangeTasks: number;
  overdueInstances: number;
  upcomingInstances: number; // 即将到期的实�?
}

/**
 * 分布统计信息
 */
export interface DistributionStatsInfo {
  tasksByImportance: Record<string, number>; // 按重要性分�?
  tasksByUrgency: Record<string, number>; // 按紧急度分布
  tasksByFolder: Record<string, number>; // 按文件夹分布
  tasksByTag: Record<string, number>; // 按标签分�?
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
