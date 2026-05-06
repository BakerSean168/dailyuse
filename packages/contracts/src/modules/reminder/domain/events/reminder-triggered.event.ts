import type { IdentityId, ReminderGroupId, ReminderTemplateId } from '../../../../primitives';
import type { ReminderTemplateServerDTO } from '../../aggregates/reminder-template-server';

export interface ReminderTriggeredEvent {
  identityId: IdentityId;
  templateId: ReminderTemplateId;
  groupId: ReminderGroupId | null;
  triggeredAt: number;
  nextTriggerAt: number | null;
  reminder: ReminderTemplateServerDTO;
}
