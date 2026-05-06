import type { IdentityId, ReminderGroupId, ReminderTemplateId } from '../../../../primitives';
import type { ReminderTemplateServerDTO } from '../../aggregates/reminder-template-server';

export interface ReminderTemplateMovedEvent {
  identityId: IdentityId;
  templateId: ReminderTemplateId;
  oldGroupId: ReminderGroupId | null;
  newGroupId: ReminderGroupId | null;
  reminder: ReminderTemplateServerDTO;
}
