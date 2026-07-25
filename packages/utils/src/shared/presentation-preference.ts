/**
 * Residual 1005: sole presentation preference helpers for web auth + app-vue settings.
 * Locale is zh-CN when browser language starts with zh; theme defaults to auto.
 */

export type PresentationLocale = 'zh-CN' | 'en-US';
export type PresentationThemeMode = 'light' | 'dark' | 'auto';

export function detectBrowserLocale(): PresentationLocale {
  if (typeof navigator === 'undefined') {
    return 'zh-CN';
  }

  const candidates = [...navigator.languages, navigator.language].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );

  return candidates.some((value) => value.toLowerCase().startsWith('zh')) ? 'zh-CN' : 'en-US';
}

export function normalizeLocale(value: unknown): PresentationLocale {
  return value === 'zh-CN' || value === 'en-US' ? value : detectBrowserLocale();
}

export function normalizeTheme(value: unknown): PresentationThemeMode {
  return value === 'light' || value === 'dark' || value === 'auto' ? value : 'auto';
}
