/**
 * NotificationMetadata Value Object (Server)
 * ï¿½Cpn<ï¿½a - 
ï¿½ï¿½
 */

import type { NotificationMetadataClientDTO } from './notification-metadata-client';

// ============ ï¿½ï¿½I ============

/**
 * ï¿½Cpn - Server ï¿½ï¿½
 */
export interface INotificationMetadataServer {
  icon: string | null;
  image: string | null;
  color: string | null;
  sound: string | null;
  badge: number | null;
  data?: any; // ï¿½Ipn

  // <ï¿½aï¿½ï¿½
  equals(other: INotificationMetadataServer): boolean;
  with(
    updates: Partial<
      Omit<
        INotificationMetadataServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationMetadataServer;

  // DTO lbï¿½ï¿½
}

// ============ DTO ï¿½I ============

/**
 * NotificationMetadata Server DTO
 */
export interface NotificationMetadataServerDTO {
  icon: string | null;
  image: string | null;
  color: string | null;
  sound: string | null;
  badge: number | null;
  data?: any;
}

/**
 * NotificationMetadata Persistence DTO
 */
export interface NotificationMetadataPersistenceDTO {
  icon: string | null;
  image: string | null;
  color: string | null;
  sound: string | null;
  badge: number | null;
  data: string | null; // JSON string
}

// ============ {ï¿½ï¿½ï¿?============

export type NotificationMetadataServer = INotificationMetadataServer;
