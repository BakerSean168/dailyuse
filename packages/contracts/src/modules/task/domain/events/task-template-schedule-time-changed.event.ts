import type { TaskTemplateServerDTO } from '../../aggregates';
import type { TaskTimeConfigDTO } from '../../value-objects';

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
