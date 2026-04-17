import type { TaskTemplateServerDTO } from '../../aggregates/task-template-server';
import type { TaskTimeConfigDTO } from '../../value-objects/task-time-config';

export interface TaskTemplateScheduleTimeChangedEvent {
  identityId: string;
  taskTemplate: TaskTemplateServerDTO;
  oldStartDate: Date | null;
  oldDueDate: Date | null;
  newStartDate: Date | null;
  newDueDate: Date | null;
  oldTimeConfig?: TaskTimeConfigDTO | null;
  newTimeConfig?: TaskTimeConfigDTO | null;
}
