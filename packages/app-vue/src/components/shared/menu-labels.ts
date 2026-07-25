/**
 * Centralized menu label constants — backed by vue-i18n.
 *
 * All ActionableWrapper consumers should import labels from here.
 * Internally, `menuLabel()` delegates to vue-i18n's global `t()`.
 * Locale changes go through vue-i18n (or the useLocaleSync composable).
 */

import { getI18nGlobal } from '../../plugins/i18n';

export type SupportedLocale = 'zh-CN' | 'en-US';

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
