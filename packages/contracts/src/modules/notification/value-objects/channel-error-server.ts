/**
 * ChannelError Value Object (Server)
 *  S�?�a - 
��
 */

import type { ChannelErrorClientDTO } from './channel-error-client';
// ============ ��I ============

/**
 *  S�?- Server ��
 */
export interface IChannelErrorServer {
  code: string;
  message: string;
  details?: any;

  // <�a��
  with(
    updates: Partial<
      Omit<
        IChannelErrorServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IChannelErrorServer;

  // DTO lb��
}

// ============ DTO �I ============

/**
 * ChannelError Server DTO
 */
export interface ChannelErrorServerDTO {
  code: string;
  message: string;
  details?: any;
}

/**
 * ChannelError Persistence DTO
 */
export interface ChannelErrorPersistenceDTO {
  code: string;
  message: string;
  details: string | null; // JSON string
}

// ============ {���?============

export type ChannelErrorServer = IChannelErrorServer;
