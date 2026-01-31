/**
 * ChannelError Value Object (Server)
 *  Sï¿?ï¿½a - 
ï¿½ï¿½
 */

import type { ChannelErrorClientDTO } from './channel-error-client';
// ============ ï¿½ï¿½I ============

/**
 *  Sï¿?- Server ï¿½ï¿½
 */
export interface IChannelErrorServer {
  code: string;
  message: string;
  details?: any;

  // <ï¿½aï¿½ï¿½
  equals(other: IChannelErrorServer): boolean;
  with(
    updates: Partial<
      Omit<
        IChannelErrorServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IChannelErrorServer;

  // DTO lbï¿½ï¿½
}

// ============ DTO ï¿½I ============

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

// ============ {ï¿½ï¿½ï¿?============

export type ChannelErrorServer = IChannelErrorServer;
