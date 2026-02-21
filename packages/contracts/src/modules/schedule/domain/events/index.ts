/**
 * Schedule Module - Domain Events
 *
 * ScheduleTask 相关事件定义在 aggregates/schedule-task-server.ts 中
 */

// Legacy compatibility
export interface ScheduleCreatedDomainEvent {
  aggregateId: string;
  timestamp: number;
}

export interface ScheduleTaskExecutedDomainEvent {
  aggregateId: string;
  timestamp: number;
  executionId: string;
}
