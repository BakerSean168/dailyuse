import type { ReminderResponseAction } from '@dailyuse/contracts/reminder';
import { ReminderResponse } from '../../../../domain/entities/reminder-response';
import { ReminderResponseId } from '../../../../domain/value-objects/reminder-response-id';

export type PowerSyncReminderResponseRow = {
  id: string;
  identity_id: string;
  template_id: string;
  action: string;
  response_time: number | null;
  timestamp: string;
  created_at: string;
};

export class PowerSyncReminderResponseMapper {
  static toDomain(data: PowerSyncReminderResponseRow): ReminderResponse {
    return ReminderResponse.load({
      id: ReminderResponseId.of(data.id),
      reminderTemplateId: data.template_id,
      identityId: data.identity_id,
      action: data.action as ReminderResponseAction,
      responseTime: data.response_time != null ? new Date(data.response_time) : null,
      timestamp: new Date(data.timestamp),
    });
  }
}
