/**
 * NotificationMetadata Value Object (Server)
 * �Cpn<�a - 
��
 */

import type { NotificationMetadataClientDTO } from './NotificationMetadataClient';

// ============ ��I ============

/**
 * �Cpn - Server ��
 */
export interface INotificationMetadataServer {
  icon?: string | null;
  image?: string | null;
  color?: string | null;
  sound?: string | null;
  badge?: number | null;
  data?: any; // �Ipn

  // <�a��
  equals(other: INotificationMetadataServer): boolean;
  with(
    updates: Partial<
      Omit<
        INotificationMetadataServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationMetadataServer;

  // DTO lb��}

// ============ DTO �I ============

/**
 * NotificationMetadata Server DTO
 */
export interface NotificationMetadataServerDTO {
  icon?: string | null;
  image?: string | null;
  color?: string | null;
  sound?: string | null;
  badge?: number | null;
  data?: any;
}

/**
 * NotificationMetadata Persistence DTO
 */
export interface NotificationMetadataPersistenceDTO {
  icon?: string | null;
  image?: string | null;
  color?: string | null;
  sound?: string | null;
  badge?: number | null;
  data?: string | null; // JSON string
}

// ============ {��� ============

export type NotificationMetadataServer = INotificationMetadataServer;
