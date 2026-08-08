/**
 * Reminder Response Entity - Server
 * 提醒响应实体 - 服务端
 *
 * Residual 861: ReminderResponseClientDTO dual body retired —
 * Client is Omit<Server, 'identityId'> (server-only identity scope).
 */

import type { ReminderResponseId, ReminderTemplateId, IdentityId } from '../../../primitives';

/**
 * R3c：响应时长值对象（秒）。
 * 语义约束：非负整数秒；snooze 的 duration 必填且 > 0。
 */
export type ReminderResponseDurationSeconds = number & { readonly __brand: 'ReminderResponseDurationSeconds' };

export function toReminderResponseDurationSeconds(value: number): ReminderResponseDurationSeconds {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid reminder response duration: ${value} (must be non-negative integer seconds)`);
  }
  return value as ReminderResponseDurationSeconds;
}

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
  /** R3c：响应/延后时长（秒）；snooze 必填且 > 0。 */
  responseTime?: ReminderResponseDurationSeconds | null;
  timestamp: number; // epoch ms
}

// Residual 861: Client dual retired — public shape without identityId.
export type ReminderResponseClientDTO = Omit<ReminderResponseServerDTO, 'identityId'>;
