import type { IdentityId, TaskInstanceId, TaskTemplateId } from '../../../../primitives';

/** Task occurrence time changed by its owning Task command. */
export interface TaskRescheduledEvent {
  identityId: IdentityId;
  taskInstanceId: TaskInstanceId;
  taskTemplateId: TaskTemplateId;
  previousDueDate: number;
  newDueDate: number;
}
