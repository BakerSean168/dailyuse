/**
 * ChannelError Value Object (Client)
 *  S�<�a - �7�
 */

import type { ChannelErrorServerDTO } from './ChannelErrorServer';

// ============ ��I ============

/**
 *  S� - Client ��
 */
export interface IChannelErrorClient {
  code: string;
  message: string;
  details?: any;

  // UI ��^'
  displayMessage: string; // (7�}��o
  isRetryable: boolean; // /&���

  // <�a��
  equals(other: IChannelErrorClient): boolean;

  // DTO lb��}

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

// ============ {��� ============

export type ChannelErrorClient = IChannelErrorClient;
