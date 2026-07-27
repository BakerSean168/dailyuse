import type { PartialTimeStyle, TimeStyle } from '../types';
import { DEFAULT_TIME_STYLE, mergeTimeStyle } from './default-style';

export type PresentationLocaleLike = 'zh-CN' | 'en-US' | string;

/**
 * W8: map presentation preference locale → TimeStyle partial.
 * Theme is intentionally not part of TimeStyle.
 */
export function timeStyleFromPresentationLocale(
  locale: PresentationLocaleLike | null | undefined,
  base: TimeStyle = DEFAULT_TIME_STYLE,
): TimeStyle {
  const normalized =
    locale === 'en-US' || (typeof locale === 'string' && locale.toLowerCase().startsWith('en'))
      ? 'en-US'
      : locale === 'zh-CN' || (typeof locale === 'string' && locale.toLowerCase().startsWith('zh'))
        ? 'zh-CN'
        : base.locale;
  return mergeTimeStyle(base, { locale: normalized });
}

export function partialTimeStyleFromLocale(
  locale: PresentationLocaleLike | null | undefined,
): PartialTimeStyle {
  if (locale == null || locale === '') return {};
  if (typeof locale === 'string' && locale.toLowerCase().startsWith('en')) {
    return { locale: 'en-US' };
  }
  if (typeof locale === 'string' && locale.toLowerCase().startsWith('zh')) {
    return { locale: 'zh-CN' };
  }
  return { locale: String(locale) };
}
