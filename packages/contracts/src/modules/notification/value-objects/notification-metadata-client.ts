/**
 * NotificationMetadata Value Object (Client)
 * ï¿½Cpn<ï¿½a - ï¿?ï¿?
 */

import type { NotificationMetadataServerDTO } from './notification-metadata-server';

// ============ ï¿½ï¿½I ============

/**
 * ï¿½Cpn - Client ï¿½ï¿½
 */
export interface INotificationMetadataClient {
  icon: string | null;
  image: string | null;
  color: string | null;
  sound: string | null;
  badge: number | null;
  data?: any;

  // UI ï¿½ï¿½^'
  hasIcon: boolean;
  hasImage: boolean;
  hasBadge: boolean;

  // <ï¿½aï¿½ï¿½
  equals(other: INotificationMetadataClient): boolean;

  // DTO lbï¿½ï¿½
}

// ============ DTO ï¿½I ============

/**
 * NotificationMetadata Client DTO
 */
export interface NotificationMetadataClientDTO {
  icon: string | null;
  image: string | null;
  color: string | null;
  sound: string | null;
  badge: number | null;
  data?: any;
  hasIcon: boolean;
  hasImage: boolean;
  hasBadge: boolean;
}

// ============ {ï¿½ï¿½ï¿?============

export type NotificationMetadataClient = INotificationMetadataClient;
