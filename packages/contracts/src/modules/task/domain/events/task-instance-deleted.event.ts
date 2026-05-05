import type { IdentityId, TaskInstanceId, TaskTemplateId } from '../../../../primitives';

export interface TaskInstanceDeletedEvent {
  identityId: IdentityId;
  taskInstanceId: TaskInstanceId;
  taskTemplateId: TaskTemplateId;
  deletedAt: number;
}
