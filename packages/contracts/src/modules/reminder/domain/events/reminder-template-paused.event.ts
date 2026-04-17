import type { ReminderTemplateServerDTO } from '../../aggregates/reminder-template-server';

export interface ReminderTemplatePausedEvent {
  identityId: string;
  templateId: string;
  reminder: ReminderTemplateServerDTO;
}
