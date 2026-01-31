/**
 * CategoryPreference Value Object (Client)
 * {O}<ï¿½a - ï¿?ï¿?
 */

import type { ImportanceLevel } from '../../../shared/index';
import type { ChannelPreference, CategoryPreferenceServerDTO } from './category-preference-server';

// ============ ï¿½ï¿½I ============

/**
 * {O} - Client ï¿½ï¿½
 */
export interface ICategoryPreferenceClient {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[];

  // UI ï¿½ï¿½^'
  enabledChannelsCount: number;
  enabledChannelsList: string[]; // ["ï¿?ï¿?, "ï¿½ï¿½"]
  importanceText: string; // "ï¿½vÍ, ^8Í"

  // <ï¿½aï¿½ï¿½
  equals(other: ICategoryPreferenceClient): boolean;

  // DTO lbï¿½ï¿½
}

// ============ DTO ï¿½I ============

/**
 * CategoryPreference Client DTO
 */
export interface CategoryPreferenceClientDTO {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[];
  enabledChannelsCount: number;
  enabledChannelsList: string[];
  importanceText: string;
}

// ============ {ï¿½ï¿½ï¿?============

export type CategoryPreferenceClient = ICategoryPreferenceClient;
