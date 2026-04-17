import type { TaskTemplateServerDTO } from '../../aggregates/task-template-server';

export interface TaskUpdatedEvent {
  identityId: string;
  task: TaskTemplateServerDTO;
  changes: string[];
}
