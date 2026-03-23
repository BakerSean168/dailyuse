import type { ReminderTemplateServerDTO } from '../../aggregates';

export interface ReminderTemplatePausedEvent {
  identityId: string;
  templateId: string;
  reminder: ReminderTemplateServerDTO;
}
