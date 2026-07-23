// Residual 1005: sole presentation helpers (local dual retired).
import {
  detectBrowserLocale,
  normalizeLocale,
  normalizeTheme,
  type PresentationLocale,
  type PresentationThemeMode,
} from '@dailyuse/utils/shared';

export type AuthLocale = PresentationLocale;
export type AuthThemeMode = PresentationThemeMode;

const STORAGE_KEY = 'presentation-preference';

interface PresentationPreferenceState {
  locale: AuthLocale;
  theme: AuthThemeMode;
}

// Residual 1005: detectBrowserLocale/normalizeLocale/normalizeTheme elevated to @dailyuse/utils/shared.

export function readPresentationPreferenceState(): PresentationPreferenceState {
  if (typeof window === 'undefined') {
    return {
      locale: 'zh-CN',
      theme: 'auto',
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        locale: detectBrowserLocale(),
        theme: 'auto',
      };
    }

    const parsed = JSON.parse(raw) as Partial<PresentationPreferenceState> | null;
    return {
      locale: normalizeLocale(parsed?.locale),
      theme: normalizeTheme(parsed?.theme),
    };
  } catch {
    return {
      locale: detectBrowserLocale(),
      theme: 'auto',
    };
  }
}

export function writePresentationPreferenceState(
  nextState: Partial<PresentationPreferenceState>,
): PresentationPreferenceState {
  const state = {
    ...readPresentationPreferenceState(),
    ...nextState,
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        locale: normalizeLocale(state.locale),
        theme: normalizeTheme(state.theme),
      }),
    );
  }

  return {
    locale: normalizeLocale(state.locale),
    theme: normalizeTheme(state.theme),
  };
}

export function applyAuthTheme(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.classList.add('dark');
  root.dataset.theme = 'dark';
  root.style.colorScheme = 'dark';
}

export function applyAuthLocale(locale: AuthLocale): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
}
