import type { TaskTemplateServerDTO } from '../../aggregates/task-template-server';
import type { TaskTimeConfigDTO } from '../../value-objects/task-time-config';
import type { IdentityId, Instant } from '../../../../primitives';

export interface TaskTemplateScheduleTimeChangedEvent {
  identityId: IdentityId;
  taskTemplate: TaskTemplateServerDTO;
  oldStartDate: Instant | null;
  oldDueDate: Instant | null;
  newStartDate: Instant | null;
  newDueDate: Instant | null;
  oldTimeConfig?: TaskTimeConfigDTO | null;
  newTimeConfig?: TaskTimeConfigDTO | null;
}
