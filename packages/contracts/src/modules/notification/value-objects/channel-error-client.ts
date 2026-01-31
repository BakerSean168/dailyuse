/**
 * ChannelError Value Object (Client)
 *  Sï¿?ï¿½a - ï¿?ï¿?
 */

import type { ChannelErrorServerDTO } from './channel-error-server';

// ============ ï¿½ï¿½I ============

/**
 *  Sï¿?- Client ï¿½ï¿½
 */
export interface IChannelErrorClient {
  code: string;
  message: string;
  details?: any;

  // UI ï¿½ï¿½^'
  displayMessage: string; // (7ï¿½}ï¿?ï¿½o
  isRetryable: boolean; // /&ï¿½ï¿½ï¿?

  // <ï¿½aï¿½ï¿½
  equals(other: IChannelErrorClient): boolean;

  // DTO lbï¿½ï¿½
}

// ============ DTO ï¿½I ============

/**
 * ChannelError Client DTO
 */
export interface ChannelErrorClientDTO {
  code: string;
  message: string;
  details?: any;
  displayMessage: string;
  isRetryable: boolean;
}

// ============ {ï¿½ï¿½ï¿?============

export type ChannelErrorClient = IChannelErrorClient;
