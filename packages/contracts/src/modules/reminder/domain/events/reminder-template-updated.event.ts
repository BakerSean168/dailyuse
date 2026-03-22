import type { ReminderTemplateServerDTO } from '../../aggregates';

export interface ReminderTemplateUpdatedEvent {
  identityId: string;
  templateId: string;
  reminder: ReminderTemplateServerDTO;
  changes: string[];
}
