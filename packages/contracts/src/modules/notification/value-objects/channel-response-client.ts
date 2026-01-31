/**
 * ChannelResponse Value Object (Client)
 *  S͔<�a - �?�?
 */

import type { ChannelResponseServerDTO } from './channel-response-server';

// ============ ��I ============

/**
 *  S͔ - Client ��
 */
export interface IChannelResponseClient {
  messageId: string | null;
  statusCode: number | null;
  data?: any;

  // UI ��^'
  isSuccess: boolean;
  statusText: string;

  // <�a��

  // DTO lb��
}

// ============ DTO �I ============

/**
 * ChannelResponse Client DTO
 */
export interface ChannelResponseClientDTO {
  messageId: string | null;
  statusCode: number | null;
  data?: any;
  isSuccess: boolean;
  statusText: string;
}

// ============ {���?============

export type ChannelResponseClient = IChannelResponseClient;
