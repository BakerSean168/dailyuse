/**
 * Schedule Domain Event Map
 * 
 * Event Naming Convention: schedule:<action>
 * - schedule:statistics-create - Statistics created
 * - schedule:statistics-update - Statistics updated
 * - schedule:task-count-change - Task count changed
 * - schedule:execution-record - Execution recorded
 * - schedule:module-update - Module stats updated
 * - schedule:task-create - Task created
 * - schedule:task-pause - Task paused
 * - schedule:task-resume - Task resumed
 * - schedule:task-complete - Task completed
 * - schedule:task-cancel - Task cancelled
 * - schedule:task-fail - Task failed
 * - schedule:task-execute - Task executed
 * - schedule:task-schedule-update - Task schedule updated
 */
export type ScheduleEventMap = {
  // ScheduleStatistics Events
  'schedule:statistics-create': { identityId: string };
  'schedule:statistics-update': { identityId: string; changes: string[] };
  'schedule:task-count-change': { status: string; delta: number; totalTasks: number };
  'schedule:execution-record': { status: string; duration: number; sourceModule: string; totalExecutions: number };
  'schedule:module-update': { moduleName: string; taskCount: number; executionCount: number };

  // ScheduleTask Events
  'schedule:task-create': { scheduleTaskId: string; name: string; sourceModule: string; sourceEntityId: string; cronExpression: string };
  'schedule:task-pause': { scheduleTaskId: string; sourceModule: string; sourceEntityId: string; reason?: string };
  'schedule:task-resume': { scheduleTaskId: string; sourceModule: string; sourceEntityId: string; nextRunAt: number };
  'schedule:task-complete': { scheduleTaskId: string; sourceModule: string; sourceEntityId: string; totalExecutions: number };
  'schedule:task-cancel': { scheduleTaskId: string; sourceModule: string; sourceEntityId: string; reason: string };
  'schedule:task-fail': { scheduleTaskId: string; sourceModule: string; sourceEntityId: string; error: string; consecutiveFailures: number };
  'schedule:task-execute': { scheduleTaskId: string; executionId: string; sourceModule: string; sourceEntityId: string; status: string; duration: number };
  'schedule:task-schedule-update': { scheduleTaskId: string; previousCronExpression: string; newCronExpression: string; nextRunAt: number };
};
