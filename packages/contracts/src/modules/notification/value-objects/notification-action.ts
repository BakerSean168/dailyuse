/**
 * NotificationAction Value Object
 * 通知动作值对象
 *
 * Residual 851: NotificationActionDTO dual retired — sole NotificationAction interface + type alias.
 */

import type { NotificationActionType } from './notification-action-type';

// Residual 851: sole NotificationAction body.
export interface NotificationAction {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: unknown;
}

// Residual 851: NotificationActionDTO dual retired — DTO is the NotificationAction shape.
export type NotificationActionDTO = NotificationAction;
