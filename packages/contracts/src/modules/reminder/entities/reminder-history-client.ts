/**
 * Reminder History Entity - Client Interface
 */

import type {
  ReminderTemplateId,
  ReminderHistoryId,
  TransferDate,
} from '../../../primitives';
import type { TriggerResult } from '../value-objects/trigger-result';
import type { NotificationChannel } from '../value-objects/notification-channel';

// ============ DTO Definitions ============

/**
 * Reminder History Client DTO
 */
export interface ReminderHistoryClientDTO {
  id: ReminderHistoryId;
  templateId: ReminderTemplateId;
  triggeredAt: TransferDate;
  result: TriggerResult;
  error: string | null;
  notificationSent: boolean;
  notificationChannels: NotificationChannel[] | null;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

/** Static factory method interface for Reminder History Client. */
