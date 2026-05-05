import type { IdentityId, TaskInstanceId, TaskTemplateId } from '../../../../primitives';

export interface TaskInstanceSkippedEvent {
  identityId: IdentityId;
  taskInstanceId: TaskInstanceId;
  taskTemplateId: TaskTemplateId;
  skippedAt: number;
  reason: string | null;
}
