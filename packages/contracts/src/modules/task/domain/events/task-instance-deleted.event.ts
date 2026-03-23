export interface TaskInstanceDeletedEvent {
  identityId: string;
  taskInstanceId: string;
  taskTemplateId: string;
  deletedAt: number;
}
