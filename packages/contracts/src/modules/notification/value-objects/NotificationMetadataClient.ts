/**
 * NotificationMetadata Value Object (Client)
 * �Cpn<�a - �7�
 */

import type { NotificationMetadataServerDTO } from './NotificationMetadataServer';

// ============ ��I ============

/**
 * �Cpn - Client ��
 */
export interface INotificationMetadataClient {
  icon?: string | null;
  image?: string | null;
  color?: string | null;
  sound?: string | null;
  badge?: number | null;
  data?: any;

  // UI ��^'
  hasIcon: boolean;
  hasImage: boolean;
  hasBadge: boolean;

  // <�a��
  equals(other: INotificationMetadataClient): boolean;

  // DTO lb��}

// ============ DTO �I ============

/**
 * NotificationMetadata Client DTO
 */
export interface NotificationMetadataClientDTO {
  icon?: string | null;
  image?: string | null;
  color?: string | null;
  sound?: string | null;
  badge?: number | null;
  data?: any;
  hasIcon: boolean;
  hasImage: boolean;
  hasBadge: boolean;
}

// ============ {��� ============

export type NotificationMetadataClient = INotificationMetadataClient;
