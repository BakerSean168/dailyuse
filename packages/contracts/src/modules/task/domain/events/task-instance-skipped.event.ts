export interface TaskInstanceSkippedEvent {
  identityId: string;
  taskInstanceId: string;
  taskTemplateId: string;
  skippedAt: number;
  reason: string | null;
}
