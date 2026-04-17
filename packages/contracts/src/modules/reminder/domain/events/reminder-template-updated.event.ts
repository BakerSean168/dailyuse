import type { ReminderTemplateServerDTO } from '../../aggregates/reminder-template-server';

export interface ReminderTemplateUpdatedEvent {
  identityId: string;
  templateId: string;
  reminder: ReminderTemplateServerDTO;
  changes: string[];
}
