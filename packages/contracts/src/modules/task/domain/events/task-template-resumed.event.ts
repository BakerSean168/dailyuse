import type { TaskTemplateServerDTO } from '../../aggregates/task-template-server';

export interface TaskTemplateResumedEvent {
  identityId: string;
  taskTemplateId: string;
  resumedAt: number;
  taskTemplate: TaskTemplateServerDTO;
}
