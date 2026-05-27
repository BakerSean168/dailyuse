/**
 * Dashboard read-model module
 *
 * Pure projection logic that aggregates data from multiple bounded contexts
 * into a single dashboard view. No side effects, no transport awareness.
 *
 * Consumers provide a `DashboardReadSource` port implementation:
 * - API: Prisma-backed adapter in `apps/api/src/modules/dashboard/`
 * - Desktop: PowerSync-backed adapter in `apps/desktop/src/main/services/`
 *
 * @module @dailyuse/dashboard
 */

// Contract types (re-exported for convenience)
export type { DashboardData } from '@dailyuse/contracts/dashboard';
export type {
  DashboardStats,
  ActivityItem,
  TrendDay,
  GoalProgressItem,
  TaskBoardSummary,
  ScheduleItem,
} from '@dailyuse/contracts/dashboard';

// Domain: port interface + record types
export type {
  DashboardGoalRecord,
  DashboardTaskTemplateRecord,
  DashboardTaskInstanceRecord,
  DashboardScheduleRecord,
  DashboardReminderRecord,
  DashboardReadSource,
} from './domain/types';

// Application: projection logic
export { getDashboardData } from './domain/projection';
