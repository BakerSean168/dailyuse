import type { TaskTemplateServerDTO } from '../../aggregates/task-template-server';
import type { IdentityId, TaskTemplateId } from '../../../../primitives';

export interface TaskTemplateResumedEvent {
  identityId: IdentityId;
  taskTemplateId: TaskTemplateId;
  resumedAt: number;
  taskTemplate: TaskTemplateServerDTO;
}
