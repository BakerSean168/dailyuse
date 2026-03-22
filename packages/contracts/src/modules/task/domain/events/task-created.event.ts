import type { TaskTemplateServerDTO } from '../../aggregates';

export interface TaskCreatedEvent {
  identityId: string;
  task: TaskTemplateServerDTO;
  templateId: string;
  goalId: string | null;
}
