import type { TaskTemplateServerDTO } from '../../aggregates/task-template-server';

export interface TaskTemplatePausedEvent {
  identityId: string;
  taskTemplateId: string;
  pausedAt: number;
  taskTemplate: TaskTemplateServerDTO;
}
