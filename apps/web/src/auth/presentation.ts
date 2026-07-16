export type AuthLocale = 'zh-CN' | 'en-US';
export type AuthThemeMode = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'presentation-preference';

interface PresentationPreferenceState {
  locale: AuthLocale;
  theme: AuthThemeMode;
}

function detectBrowserLocale(): AuthLocale {
  if (typeof navigator === 'undefined') {
    return 'zh-CN';
  }

  const candidates = [...navigator.languages, navigator.language].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );

  return candidates.some((value) => value.toLowerCase().startsWith('zh')) ? 'zh-CN' : 'en-US';
}

export function normalizeLocale(value: unknown): AuthLocale {
  return value === 'zh-CN' || value === 'en-US' ? value : detectBrowserLocale();
}

export function normalizeTheme(value: unknown): AuthThemeMode {
  return value === 'light' || value === 'dark' || value === 'auto' ? value : 'auto';
}

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
