/**
 * DoNotDisturbConfig Value Object (Server)
 * MSpMn<ï¿½a - 
ï¿½ï¿½
 */
import type { DoNotDisturbConfigClientDTO } from './do-not-disturb-config-client';

// ============ ï¿½ï¿½I ============

/**
 * MSpMn - Server ï¿½ï¿½
 */
export interface IDoNotDisturbConfigServer {
  enabled: boolean;
  startTime: string; // 'HH:mm' format
  endTime: string; // 'HH:mm' format
  daysOfWeek: number[]; // 0-6 (0=Sunday)

  // <ï¿½aï¿½ï¿½
  equals(other: IDoNotDisturbConfigServer): boolean;
  with(
    updates: Partial<
      Omit<
        IDoNotDisturbConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IDoNotDisturbConfigServer;

  // ï¿½ï¿½ï¿?
  isInPeriod(timestamp: Date): boolean;

  // DTO lbï¿½ï¿½
}

// ============ DTO ï¿½I ============

/**
 * DoNotDisturbConfig Server DTO
 */
export interface DoNotDisturbConfigServerDTO {
  enabled: boolean;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
}

/**
 * DoNotDisturbConfig Persistence DTO
 */
export interface DoNotDisturbConfigPersistenceDTO {
  enabled: boolean;
  startTime: string;
  endTime: string;
  daysOfWeek: string; // JSON.stringify(number[])
}

// ============ {ï¿½ï¿½ï¿?============

export type DoNotDisturbConfigServer = IDoNotDisturbConfigServer;
