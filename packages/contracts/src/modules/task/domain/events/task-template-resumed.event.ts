import type { TaskTemplateServerDTO } from '../../aggregates';

export interface TaskTemplateResumedEvent {
  identityId: string;
  taskTemplateId: string;
  resumedAt: number;
  taskTemplate: TaskTemplateServerDTO;
}
