/**
 * ChannelError Value Object (Client)
 *  S�?�a - �?�?
 */

import type { ChannelErrorServerDTO } from './channel-error-server';

// ============ ��I ============

/**
 *  S�?- Client ��
 */
export interface IChannelErrorClient {
  code: string;
  message: string;
  details?: any;

  // UI ��^'
  displayMessage: string; // (7�}�?�o
  isRetryable: boolean; // /&���?

  // <�a��

  // DTO lb��
}

// ============ DTO �I ============

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

// ============ {���?============

export type ChannelErrorClient = IChannelErrorClient;
