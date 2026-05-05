import type { TaskTemplateServerDTO } from '../../aggregates/task-template-server';
import type { IdentityId, TaskTemplateId } from '../../../../primitives';

export interface TaskDeletedEvent {
  identityId: IdentityId;
  taskTemplateId: TaskTemplateId;
  isSoftDelete: boolean;
  deletedAt: number;
  task: TaskTemplateServerDTO;
}
