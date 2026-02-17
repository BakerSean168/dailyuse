export interface ScheduleCreatedDomainEvent {
  aggregateId: string;
  timestamp: number;
}

export interface ScheduleTaskExecutedDomainEvent {
  aggregateId: string;
  timestamp: number;
  executionId: string;
}
