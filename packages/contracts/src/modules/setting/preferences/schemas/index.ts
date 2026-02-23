/**
 * User Preferences Zod Schemas — Single Source of Truth
 *
 * All preference types, defaults, and validation are derived from these Zod schemas.
 * Adding a new field: add to the relevant category schema with a `.default()` value.
 * Adding a new category: create a new schema file, import here, add to UserPreferencesSchema.
 */

import { z } from 'zod';
import { AppearanceSchema } from './appearance.schema';
import { LocaleSchema } from './locale.schema';
import { WorkflowSchema } from './workflow.schema';
import { PrivacySchema } from './privacy.schema';
import { NotificationSchema } from './notification.schema';
import { EditorSchema } from './editor.schema';
import { ShortcutsSchema } from './shortcuts.schema';
import { ExperimentalSchema } from './experimental.schema';
import { UISchema } from './ui.schema';

export const UserPreferencesSchema = z.object({
  appearance: AppearanceSchema.default({}),
  locale: LocaleSchema.default({}),
  workflow: WorkflowSchema.default({}),
  privacy: PrivacySchema.default({}),
  notification: NotificationSchema.default({}),
  editor: EditorSchema.default({}),
  shortcuts: ShortcutsSchema.default({}),
  experimental: ExperimentalSchema.default({}),
  ui: UISchema.default({}),
});

/** Map of category name → category Zod schema */
export const CATEGORY_SCHEMAS = {
  appearance: AppearanceSchema,
  locale: LocaleSchema,
  workflow: WorkflowSchema,
  privacy: PrivacySchema,
  notification: NotificationSchema,
  editor: EditorSchema,
  shortcuts: ShortcutsSchema,
  experimental: ExperimentalSchema,
  ui: UISchema,
} as const;

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
};
