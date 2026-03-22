import type { TaskTemplateServerDTO } from '../../aggregates';

export interface TaskTemplatePausedEvent {
  identityId: string;
  taskTemplateId: string;
  pausedAt: number;
  taskTemplate: TaskTemplateServerDTO;
}
