/**
 * ScheduleTask Schedule Updated Event
 *
 * Triggered when: The cron/schedule configuration of a task changes
 * Subscribers: Scheduler engine
 *
 * Note: aggregateId (taskId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface ScheduleTaskScheduleUpdatedEvent {
  taskId: string;
  previousCronExpression: string;
  newCronExpression: string;
  nextRunAt: number;
}
