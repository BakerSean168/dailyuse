/**
 * NotificationAction Value Object (Client)
 * ��\<�a - �7�
 */

import type { NotificationActionType } from '../enums';
import type { NotificationActionServerDTO } from './NotificationActionServer';

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
  typeText: string; // "�*", "API(", "s�", "�I"
  icon: string;

  // <�a��
  equals(other: INotificationActionClient): boolean;

  // DTO lb��}

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

// ============ {��� ============

export type NotificationActionClient = INotificationActionClient;
