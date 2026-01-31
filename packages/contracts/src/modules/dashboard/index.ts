/**
 * Dashboard Module Exports
 * Dashboard 模块 - 显式导出
 */

// ============ Enums ============
export { WidgetSize, WidgetSizeText } from './enums';

// ============ Value Objects ============
export type { WidgetConfigDTO, WidgetConfigClient, WidgetConfigServer } from './value-objects';

// ============ Type Aliases (for backward compatibility) ============
export type { WidgetConfigDTO as WidgetConfig } from './value-objects';

// ============ Aggregates ============
export type {
  DashboardConfigClientDTO,
  DashboardConfigClient,
} from './aggregates/dashboard-config-client';

export type {
  DashboardConfigServerDTO,
  DashboardConfigPersistenceDTO,
  DashboardConfigServer,
  WidgetConfigData,
} from './aggregates/dashboard-config-server';

// ============ Legacy (保持向后兼容) ============
export type { DashboardSummary, DashboardStatisticsClientDTO } from './dashboard-statistics-client';

// ============ API Requests/Responses ============
export type {
  GetDashboardStatisticsRequest,
  DashboardStatisticsResponse,
  GetWidgetConfigRequest,
  WidgetConfigResponse,
  UpdateWidgetConfigRequest,
  ResetWidgetConfigRequest,
  InvalidateCacheRequest,
} from './api-requests';

// ============ Widget Type enum ============
/**
 * Widget 类型枚举
 * 前端使用的 Widget 类型定义
 */
export enum WidgetType {
  TASK_STATS = 'task-stats',
  TODAY_TASKS = 'today-tasks',
  GOAL_STATS = 'goal-stats',
  GOAL_PROGRESS = 'goal-progress',
  REMINDER_STATS = 'reminder-stats',
  UPCOMING_REMINDERS = 'upcoming-reminders',
  SCHEDULE_STATS = 'schedule-stats',
  SCHEDULE_CALENDAR = 'schedule-calendar',
  CUSTOM = 'custom',
}
