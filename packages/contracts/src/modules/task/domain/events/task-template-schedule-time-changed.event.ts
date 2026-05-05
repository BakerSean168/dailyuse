import type { TaskTemplateServerDTO } from '../../aggregates/task-template-server';
import type { TaskTimeConfigDTO } from '../../value-objects/task-time-config';
import type { IdentityId } from '../../../../primitives';

export interface TaskTemplateScheduleTimeChangedEvent {
  identityId: IdentityId;
  taskTemplate: TaskTemplateServerDTO;
  oldStartDate: Date | null;
  oldDueDate: Date | null;
  newStartDate: Date | null;
  newDueDate: Date | null;
  oldTimeConfig?: TaskTimeConfigDTO | null;
  newTimeConfig?: TaskTimeConfigDTO | null;
}
