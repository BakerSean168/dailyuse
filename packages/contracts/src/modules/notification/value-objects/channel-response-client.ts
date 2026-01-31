/**
 * ChannelResponse Value Object (Client)
 *  SÍ”<ï¿½a - ï¿?ï¿?
 */

import type { ChannelResponseServerDTO } from './channel-response-server';

// ============ ï¿½ï¿½I ============

/**
 *  SÍ” - Client ï¿½ï¿½
 */
export interface IChannelResponseClient {
  messageId: string | null;
  statusCode: number | null;
  data?: any;

  // UI ï¿½ï¿½^'
  isSuccess: boolean;
  statusText: string;

  // <ï¿½aï¿½ï¿½
  equals(other: IChannelResponseClient): boolean;

  // DTO lbï¿½ï¿½
}

// ============ DTO ï¿½I ============

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

// ============ {ï¿½ï¿½ï¿?============

export type ChannelResponseClient = IChannelResponseClient;
