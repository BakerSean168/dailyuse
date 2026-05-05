/**
 * Reminder History Entity - Client Interface
 */

import type {
  ReminderInstanceId,
  ReminderTemplateId,
  TransferDate,
  DomainDate,
} from '../../../primitives';
import type { TriggerResult } from '../value-objects/trigger-result';
import type { NotificationChannel } from '../value-objects/notification-channel';
import type { ReminderHistoryServerDTO } from './reminder-history-server';

// ============ DTO Definitions ============

/**
 * Reminder History Client DTO
 */
export interface ReminderHistoryClientDTO {
  id: string;
  templateId: string;
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
