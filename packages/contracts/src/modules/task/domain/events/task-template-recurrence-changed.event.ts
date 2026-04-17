import type { TaskTemplateServerDTO } from '../../aggregates/task-template-server';
import type { RecurrenceRuleDTO } from '../../value-objects/recurrence-rule';

export interface TaskTemplateRecurrenceChangedEvent {
  identityId: string;
  taskTemplate: TaskTemplateServerDTO;
  oldRecurrenceRule: RecurrenceRuleDTO | null;
  newRecurrenceRule: RecurrenceRuleDTO | null;
}
