/**
 * Setting Preference Defaults — Driven by Zod schemas
 *
 * `getDefaultPreferences()` parses an empty object through UserPreferencesSchema,
 * which fills in all `.default()` values automatically.
 * No manual default constants needed.
 */

import { UserPreferencesSchema } from './schemas';
import type { UserSettingPreferences } from './types';

// ─── Category list (derived from schema shape keys) ───────

export const PREFERENCE_CATEGORIES = Object.keys(
  UserPreferencesSchema.shape,
) as ReadonlyArray<PreferenceCategory>;

export type PreferenceCategory = keyof UserSettingPreferences;

// ─── Factory: create complete default preferences ─────────

export function getDefaultPreferences(): UserSettingPreferences {
  return UserPreferencesSchema.parse({});
}

/**
 * @deprecated Use getDefaultPreferences() instead
 */
export const createDefaultPreferences = getDefaultPreferences;
