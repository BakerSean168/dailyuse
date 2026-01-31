/**
 * RateLimit Value Object (Server)
 * ï¿½ï¿½P6<ï¿½a - 
ï¿½ï¿½
 */

import type { RateLimitClientDTO } from './rate-limit-client';
// ============ ï¿½ï¿½I ============

/**
 * ï¿½ï¿½P6 - Server ï¿½ï¿½
 */
export interface IRateLimitServer {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;

  // <ï¿½aï¿½ï¿½
  equals(other: IRateLimitServer): boolean;
  with(
    updates: Partial<
      Omit<IRateLimitServer, 'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'>
    >,
  ): IRateLimitServer;

  // DTO lbï¿½ï¿½
}

// ============ DTO ï¿½I ============

/**
 * RateLimit Server DTO
 */
export interface RateLimitServerDTO {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
}

/**
 * RateLimit Persistence DTO
 */
export interface RateLimitPersistenceDTO {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
}

// ============ {ï¿½ï¿½ï¿?============

export type RateLimitServer = IRateLimitServer;
