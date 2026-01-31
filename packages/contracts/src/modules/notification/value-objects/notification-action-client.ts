/**
 * NotificationAction Value Object (Client)
 * ��\<�a - �?�?
 */

import type { NotificationActionType } from './notification-action-type';
import type { NotificationActionServerDTO } from './notification-action-server';

// ============ ��I ============

/**
 * ��\ - Client ��
 */
export interface INotificationActionClient {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;

  // UI ��^'
  typeText: string; // "�?", "API(", "s�?, "�I"
  icon: string;

  // <�a��

  // DTO lb��
}

// ============ DTO �I ============

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

// ============ {���?============

export type NotificationActionClient = INotificationActionClient;
