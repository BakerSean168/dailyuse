/**
 * NotificationAction Value Object (Client)
 * ï¿½ï¿½\<ï¿½a - ï¿?ï¿?
 */

import type { NotificationActionType } from './notification-action-type';
import type { NotificationActionServerDTO } from './notification-action-server';

// ============ ï¿½ï¿½I ============

/**
 * ï¿½ï¿½\ - Client ï¿½ï¿½
 */
export interface INotificationActionClient {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;

  // UI ï¿½ï¿½^'
  typeText: string; // "ï¿?", "API(", "sï¿?, "ï¿½I"
  icon: string;

  // <ï¿½aï¿½ï¿½
  equals(other: INotificationActionClient): boolean;

  // DTO lbï¿½ï¿½
}

// ============ DTO ï¿½I ============

/**
 * NotificationAction Client DTO
 */
export interface NotificationActionClientDTO {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;
  typeText: string;
  icon: string;
}

// ============ {ï¿½ï¿½ï¿?============

export type NotificationActionClient = INotificationActionClient;
