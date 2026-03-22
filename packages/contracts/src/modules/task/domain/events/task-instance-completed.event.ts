export interface TaskInstanceCompletedEvent {
  identityId: string;
  taskInstanceId: string;
  taskTemplateId: string;
  completedAt: number;
}
