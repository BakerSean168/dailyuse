/**
 * Vue I18n Plugin
 *
 * Integrates vue-i18n with the app-vue DI pattern.
 *
 * Host apps (web / desktop) are responsible for:
 *   1. Installing this plugin via `app.use(createI18nPlugin())`.
 *   2. Optionally passing an initial locale (defaults to 'zh-CN').
 *
 * Vue components in app-vue can then use the standard `useI18n()` composable
 * or `$t()` in templates to translate strings.
 *
 * @module plugins/i18n
 */

import { createI18n } from 'vue-i18n';
import { zhCN, enUS } from '../locales';

// Re-export useI18n for convenience
export { useI18n } from 'vue-i18n';

export type AppLocale = 'zh-CN' | 'en-US';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyI18n = any;

/**
 * The singleton i18n instance, exported so non-component code
 * (e.g. `menu-labels.ts`, navigation helpers) can read translations.
 *
 * Will be `null` until `createI18nPlugin()` is called.
 */
let _i18n: AnyI18n | null = null;

/** Get the live i18n instance (throws if not yet initialised). */
export function getI18n(): AnyI18n {
  if (!_i18n) {
    throw new Error('[i18n] Plugin not installed. Call createI18nPlugin() first.');
  }
  return _i18n;
}

/** Convenience: get the global composer (Composition API mode). */
export function getI18nGlobal() {
  return getI18n().global;
}

/**
 * Creates the Vue I18n plugin.
 *
 * @param locale - Initial locale, defaults to `'zh-CN'`.
 *
 * @example
 * ```ts
 * // apps/web/src/main.ts
 * import { createI18nPlugin } from '@dailyuse/app-vue';
 *
 * app.use(createI18nPlugin('zh-CN'));
 * ```
 */
export function createI18nPlugin(locale: AppLocale = 'zh-CN') {
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'zh-CN',
    messages: {
      'zh-CN': zhCN,
      'en-US': enUS,
    },
    // Suppress missing-translation warnings in dev for keys not yet migrated
    missingWarn: false,
    fallbackWarn: false,
  });

  _i18n = i18n;

  return i18n;
}
