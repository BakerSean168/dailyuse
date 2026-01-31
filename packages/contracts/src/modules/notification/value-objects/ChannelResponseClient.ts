/**
 * ChannelResponse Value Object (Client)
 *  S͔<�a - �7�
 */

import type { ChannelResponseServerDTO } from './ChannelResponseServer';

// ============ ��I ============

/**
 *  S͔ - Client ��
 */
export interface IChannelResponseClient {
  messageId?: string | null;
  statusCode?: number | null;
  data?: any;

  // UI ��^'
  isSuccess: boolean;
  statusText: string;

  // <�a��
  equals(other: IChannelResponseClient): boolean;

  // DTO lb��}

// ============ DTO �I ============

/**
 * ChannelResponse Client DTO
 */
export interface ChannelResponseClientDTO {
  messageId?: string | null;
  statusCode?: number | null;
  data?: any;
  isSuccess: boolean;
  statusText: string;
}

// ============ {��� ============

export type ChannelResponseClient = IChannelResponseClient;
