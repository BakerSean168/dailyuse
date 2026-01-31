/**
 * NotificationAction Value Object (Server)
 * ��\<�a - 
��
 */

import type { NotificationActionClientDTO } from './NotificationActionClient';
import type { NotificationActionType } from '../enums';

// ============ ��I ============

/**
 * NotificationAction Server Interface
 */
export interface INotificationActionServer {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;

  // <�a��
  equals(other: INotificationActionServer): boolean;
  with(
    updates: Partial<
      Omit<
        INotificationActionServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationActionServer;

  // DTO lb��}

// ============ DTO �I ============

/**
 * NotificationAction Server DTO
 */
export interface NotificationActionServerDTO {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;
}

/**
 * NotificationAction Persistence DTO
 */
export interface NotificationActionPersistenceDTO {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: string | null; // JSON string
}

// ============ {��� ============

export type NotificationActionServer = INotificationActionServer;
