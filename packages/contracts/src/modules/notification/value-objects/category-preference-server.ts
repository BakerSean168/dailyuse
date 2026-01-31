/**
 * CategoryPreference Value Object (Server)
 * {O}<ï¿½a - 
ï¿½ï¿½
 */
import type { CategoryPreferenceClientDTO } from './category-preference-client';
import type { ImportanceLevel } from '../../../shared/index';

// ============ qï¿½{ï¿½ï¿½I ============

/**
 *  SO}ï¿½n
 */
export interface ChannelPreference {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

// ============ ï¿½ï¿½I ============

/**
 * {O} - Server ï¿½ï¿½
 */
export interface ICategoryPreferenceServer {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[]; // ï¿?ï¿½Í?ï¿?ï¿?ï¿?

  // <ï¿½aï¿½ï¿½
  equals(other: ICategoryPreferenceServer): boolean;
  with(
    updates: Partial<
      Omit<
        ICategoryPreferenceServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): ICategoryPreferenceServer;

  // DTO lbï¿½ï¿½
}

// ============ DTO ï¿½I ============

/**
 * CategoryPreference Server DTO
 */
export interface CategoryPreferenceServerDTO {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[];
}

/**
 * CategoryPreference Persistence DTO
 */
export interface CategoryPreferencePersistenceDTO {
  enabled: boolean;
  channels: string; // JSON.stringify(ChannelPreference)
  importance: string; // JSON.stringify(ImportanceLevel[])
}

// ============ {ï¿½ï¿½ï¿?============

export type CategoryPreferenceServer = ICategoryPreferenceServer;
