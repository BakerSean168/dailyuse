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
 * `@dailyuse/contracts/dashboard` — not re-exported here.
 *
 * @module @dailyuse/dashboard
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
