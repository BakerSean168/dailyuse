import type { ReminderTemplateServerDTO } from '../../aggregates/reminder-template-server';

export interface ReminderTriggeredEvent {
  identityId: string;
  templateId: string;
  groupId: string | null;
  triggeredAt: number;
  nextTriggerAt: number | null;
  reminder: ReminderTemplateServerDTO;
}
