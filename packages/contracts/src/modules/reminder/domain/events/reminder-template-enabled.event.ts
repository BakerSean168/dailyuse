import type { ReminderTemplateServerDTO } from '../../aggregates';

export interface ReminderTemplateEnabledEvent {
  identityId: string;
  templateId: string;
  activatedAt: number;
  reminder: ReminderTemplateServerDTO;
}
