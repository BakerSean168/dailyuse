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
  EditorPreferences,
  ShortcutPreferences,
  ExperimentalPreferences,
  UIStatePreferences,
  UserSettingPreferences,
} from './types';

export {
  getDefaultPreferences,
  PREFERENCE_CATEGORIES,
  type PreferenceCategory,
} from './defaults';

export {
  AppearanceSchema,
  LocaleSchema,
  WorkflowSchema,
  PrivacySchema,
  NotificationSchema,
  EditorSchema,
  ShortcutsSchema,
  ExperimentalSchema,
  UISchema,
  UserPreferencesSchema,
  CATEGORY_SCHEMAS,
} from './schemas';
