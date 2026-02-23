/**
 * Application Client Types
 */

import type { AppearancePreferences, LocalePreferences } from '@dailyuse/contracts/setting';

export type UpdateAppearanceInput = Partial<AppearancePreferences>;
export type UpdateLocaleInput = Partial<LocalePreferences>;
