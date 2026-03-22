import type { TaskTemplateServerDTO } from '../../aggregates';
import type { RecurrenceRuleDTO } from '../../value-objects';

export interface TaskTemplateRecurrenceChangedEvent {
  identityId: string;
  taskTemplate: TaskTemplateServerDTO;
  oldRecurrenceRule: RecurrenceRuleDTO | null;
  newRecurrenceRule: RecurrenceRuleDTO | null;
}
