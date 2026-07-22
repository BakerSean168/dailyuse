/**
 * Setting Preferences — Zod-first per-category preference types & schemas
 *
 * Types are inferred from Zod schemas (single source of truth).
 * Defaults are auto-generated from Zod `.default()` values.
 */

export type {
  AppearancePreferences,
  LocalePreferences,
  WorkflowPreferences,
  PrivacyPreferences,
  NotificationPreferences,
  ShortcutPreferences,
  ExperimentalPreferences,
  UIStatePreferences,
  AIPreferences,
  UserSettingPreferences,
} from './types';

export { getDefaultPreferences, PREFERENCE_CATEGORIES, type PreferenceCategory } from './defaults';

export {
  AppearanceSchema,
  LocaleSchema,
  WorkflowSchema,
  PrivacySchema,
  NotificationSchema,
  ShortcutsSchema,
  ExperimentalSchema,
  UISchema,
  AISchema,
  UserPreferencesSchema,
  CATEGORY_SCHEMAS,
} from './schemas';
