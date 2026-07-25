/**
 * Reminder Response Entity - Server
 * 提醒响应实体 - 服务端
 *
 * Residual 861: ReminderResponseClientDTO dual body retired —
 * Client is Omit<Server, 'identityId'> (server-only identity scope).
 */

import type { ReminderResponseId, ReminderTemplateId, IdentityId } from '../../../primitives';

/**
 * 响应行为类型
 */
export const ReminderResponseAction = {
  Clicked: 'CLICKED',
  Ignored: 'IGNORED',
  Snoozed: 'SNOOZED',
  Dismissed: 'DISMISSED',
  Completed: 'COMPLETED',
} as const;

export type ReminderResponseAction =
  (typeof ReminderResponseAction)[keyof typeof ReminderResponseAction];

// Residual 861: sole ReminderResponseServerDTO body.
export interface ReminderResponseServerDTO {
  id: ReminderResponseId;
  reminderTemplateId: ReminderTemplateId;
  identityId: IdentityId;
  action: ReminderResponseAction;
  responseTime?: number | null; // seconds from send to response when CLICKED/COMPLETED
  timestamp: number; // epoch ms
}

// Residual 861: Client dual retired — public shape without identityId.
export type ReminderResponseClientDTO = Omit<ReminderResponseServerDTO, 'identityId'>;
