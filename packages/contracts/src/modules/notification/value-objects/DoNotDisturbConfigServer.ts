/**
 * DoNotDisturbConfig Value Object (Server)
 * MSpMn<�a - 
��
 */
import type { DoNotDisturbConfigClientDTO } from './DoNotDisturbConfigClient';

// ============ ��I ============

/**
 * MSpMn - Server ��
 */
export interface IDoNotDisturbConfigServer {
  enabled: boolean;
  startTime: string; // 'HH:mm' format
  endTime: string; // 'HH:mm' format
  daysOfWeek: number[]; // 0-6 (0=Sunday)

  // <�a��
  equals(other: IDoNotDisturbConfigServer): boolean;
  with(
    updates: Partial<
      Omit<
        IDoNotDisturbConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IDoNotDisturbConfigServer;

  // ���
  isInPeriod(timestamp: Date): boolean;

  // DTO lb��
  toServerDTO(): DoNotDisturbConfigServerDTO;
  toClientDTO(): DoNotDisturbConfigClientDTO;
  toPersistenceDTO(): DoNotDisturbConfigPersistenceDTO;
}

// ============ DTO �I ============

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

// ============ {��� ============

export type DoNotDisturbConfigServer = IDoNotDisturbConfigServer;
