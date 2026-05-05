import type { TaskTemplateServerDTO } from '../../aggregates/task-template-server';
import type { RecurrenceRuleDTO } from '../../value-objects/recurrence-rule';
import type { IdentityId } from '../../../../primitives';

export interface TaskTemplateRecurrenceChangedEvent {
  identityId: IdentityId;
  taskTemplate: TaskTemplateServerDTO;
  oldRecurrenceRule: RecurrenceRuleDTO | null;
  newRecurrenceRule: RecurrenceRuleDTO | null;
}
