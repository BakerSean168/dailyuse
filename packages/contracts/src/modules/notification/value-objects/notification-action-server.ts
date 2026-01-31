/**
 * NotificationAction Value Object (Server)
 * ï¿½ï¿½\<ï¿½a - 
ï¿½ï¿½
 */

import type { NotificationActionClientDTO } from './notification-action-client';
import type { NotificationActionType } from './notification-action-type';

// ============ ï¿½ï¿½I ============

/**
 * NotificationAction Server Interface
 */
export interface INotificationActionServer {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;

  // <ï¿½aï¿½ï¿½
  equals(other: INotificationActionServer): boolean;
  with(
    updates: Partial<
      Omit<
        INotificationActionServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationActionServer;

  // DTO lbï¿½ï¿½
}

// ============ DTO ï¿½I ============

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
  payload: string | null; // JSON string
}

// ============ {ï¿½ï¿½ï¿?============

export type NotificationActionServer = INotificationActionServer;
