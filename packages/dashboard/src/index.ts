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
 * Contract DTO types (`DashboardData`, etc.) come from
 * `@memoflow/contracts/dashboard` — not re-exported here.
 *
 * @module @memoflow/dashboard
 */

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

export { toDashboardGoalRecord, type DashboardGoalSource } from './domain/to-dashboard-goal-record';

// Domain: TaskInstance → DashboardTaskInstanceRecord sole (Residual 1156)
export {
  toDashboardTaskInstanceRecord,
  type DashboardTaskInstanceSource,
} from './domain/to-dashboard-task-instance-record';
