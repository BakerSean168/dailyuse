import type { TaskTemplateServerDTO } from '../../aggregates/task-template-server';
import type { IdentityId, TaskTemplateId } from '../../../../primitives';

export interface TaskTemplatePausedEvent {
  identityId: IdentityId;
  taskTemplateId: TaskTemplateId;
  pausedAt: number;
  taskTemplate: TaskTemplateServerDTO;
}
