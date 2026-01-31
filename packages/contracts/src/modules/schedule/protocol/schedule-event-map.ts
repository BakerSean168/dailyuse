// 定义 Schedule 模块发出的事件
export type ScheduleEventMap = {
  // ScheduleStatistics 事件
  'schedule-statistics:created': { identityId: string };
  'schedule-statistics:updated': { identityId: string; changes: string[] };
  'schedule-statistics:task-count-changed': { status: string; delta: number; totalTasks: number };
  'schedule-statistics:execution-recorded': { status: string; duration: number; sourceModule: string; totalExecutions: number };
  'schedule-statistics:module-updated': { moduleName: string; taskCount: number; executionCount: number };

  // ScheduleTask 事件
  'schedule-task:created': { scheduleTaskId: string; name: string; sourceModule: string; sourceEntityId: string; cronExpression: string };
  'schedule-task:paused': { scheduleTaskId: string; sourceModule: string; sourceEntityId: string; reason?: string };
  'schedule-task:resumed': { scheduleTaskId: string; sourceModule: string; sourceEntityId: string; nextRunAt: number };
  'schedule-task:completed': { scheduleTaskId: string; sourceModule: string; sourceEntityId: string; totalExecutions: number };
  'schedule-task:cancelled': { scheduleTaskId: string; sourceModule: string; sourceEntityId: string; reason: string };
  'schedule-task:failed': { scheduleTaskId: string; sourceModule: string; sourceEntityId: string; error: string; consecutiveFailures: number };
  'schedule-task:executed': { scheduleTaskId: string; executionId: string; sourceModule: string; sourceEntityId: string; status: string; duration: number };
  'schedule-task:schedule-updated': { scheduleTaskId: string; previousCronExpression: string; newCronExpression: string; nextRunAt: number };
};
