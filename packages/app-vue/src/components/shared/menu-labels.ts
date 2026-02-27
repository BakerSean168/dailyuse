/**
 * Centralized menu label constants — backed by vue-i18n.
 *
 * All ActionableWrapper consumers should import labels from here.
 * Internally, `menuLabel()` delegates to vue-i18n's global `t()`.
 *
 * The `setMenuLocale()` / `getMenuLocale()` functions are kept for
 * backward compatibility but locale changes should go through the
 * vue-i18n instance (or the useLocaleSync composable).
 */

import { getI18nGlobal } from '../../plugins/i18n';

export type SupportedLocale = 'zh-CN' | 'en-US';

/** Backward-compat locale state (prefer vue-i18n's locale ref). */
let currentLocale: SupportedLocale = 'zh-CN';

export function setMenuLocale(locale: SupportedLocale): void {
  currentLocale = locale;
  // Also sync to vue-i18n if already initialised
  try {
    const global = getI18nGlobal();
    if (global.locale && typeof global.locale === 'object' && 'value' in global.locale) {
      (global.locale as { value: string }).value = locale;
    }
  } catch {
    // Plugin not yet installed — ignore
  }
}

export function getMenuLocale(): SupportedLocale {
  return currentLocale;
}

/**
 * Resolve a menu label key to the localised string.
 *
 * Delegates to vue-i18n `t('menu.<key>')`. Falls back to the key itself
 * if vue-i18n is not yet initialised.
 *
 * ```ts
 * import { menuLabel } from '../../components/shared/menu-labels';
 * const label = menuLabel('edit'); // '编辑' (or 'Edit' when locale is en-US)
 * ```
 */
export function menuLabel(key: string): string {
  try {
    const global = getI18nGlobal();
    const i18nKey = `menu.${key}`;
    const translated = global.t(i18nKey);
    // If t() returns the key back, fall back to the key itself
    return translated === i18nKey ? key : translated;
  } catch {
    // Plugin not yet installed — return raw key
    return key;
  }
}
