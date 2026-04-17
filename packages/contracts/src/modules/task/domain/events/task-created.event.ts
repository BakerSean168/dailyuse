import type { TaskTemplateServerDTO } from '../../aggregates/task-template-server';

export interface TaskCreatedEvent {
  identityId: string;
  task: TaskTemplateServerDTO;
  templateId: string;
  goalId: string | null;
}
