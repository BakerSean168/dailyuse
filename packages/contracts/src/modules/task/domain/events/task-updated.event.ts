import type { TaskTemplateServerDTO } from '../../aggregates/task-template-server';
import type { IdentityId } from '../../../../primitives';

export interface TaskUpdatedEvent {
  identityId: IdentityId;
  task: TaskTemplateServerDTO;
  changes: string[];
}
