import type { IdentityId, TaskInstanceId, TaskTemplateId } from '../../../../primitives';

export interface TaskInstanceCompletedEvent {
  identityId: IdentityId;
  taskInstanceId: TaskInstanceId;
  taskTemplateId: TaskTemplateId;
  completedAt: number;
}
