/**
 * CategoryPreference Value Object (Client)
 * {O}<�a - �7�
 */

import type { ImportanceLevel } from '../../../shared/index';
import type { ChannelPreference, CategoryPreferenceServerDTO } from './CategoryPreferenceServer';

// ============ ��I ============

/**
 * {O} - Client ��
 */
export interface ICategoryPreferenceClient {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[];

  // UI ��^'
  enabledChannelsCount: number;
  enabledChannelsList: string[]; // ["�(�", "��"]
  importanceText: string; // "�v́, ^8́"

  // <�a��
  equals(other: ICategoryPreferenceClient): boolean;

  // DTO lb��}

// ============ DTO �I ============

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

// ============ {��� ============

export type CategoryPreferenceClient = ICategoryPreferenceClient;
