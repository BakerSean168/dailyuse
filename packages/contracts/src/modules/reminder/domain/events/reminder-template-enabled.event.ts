import type { ReminderTemplateServerDTO } from '../../aggregates/reminder-template-server';

export interface ReminderTemplateEnabledEvent {
  identityId: string;
  templateId: string;
  activatedAt: number;
  reminder: ReminderTemplateServerDTO;
}
