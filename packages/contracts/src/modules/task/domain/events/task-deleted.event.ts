import type { TaskTemplateServerDTO } from '../../aggregates/task-template-server';

export interface TaskDeletedEvent {
  identityId: string;
  taskTemplateId: string;
  isSoftDelete: boolean;
  deletedAt: number;
  task: TaskTemplateServerDTO;
}
