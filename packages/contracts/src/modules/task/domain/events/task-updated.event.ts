import type { TaskTemplateServerDTO } from '../../aggregates';

export interface TaskUpdatedEvent {
  identityId: string;
  task: TaskTemplateServerDTO;
  changes: string[];
}
