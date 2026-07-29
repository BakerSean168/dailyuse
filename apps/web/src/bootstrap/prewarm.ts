/**
 * Web bootstrap prewarm helpers.
 *
 * Keeps the authenticated app chunk warm after the auth screen has painted.
 */

import { readPresentationPreferenceState } from '../auth/presentation';

export function prewarmMainAppBootstrap(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const win = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  };

  const warm = () => {
    void import('./app').catch((error) => {
      if (import.meta.env.DEV) {
        console.debug('[web] main app prewarm failed', error);
      }
    });

    const { locale } = readPresentationPreferenceState();
    void import('@memoflow/app-vue/web-i18n')
      .then(({ loadLocaleMessages }) => loadLocaleMessages(locale))
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.debug('[web] locale prewarm failed', error);
        }
      });
  };

  if (typeof win.requestIdleCallback === 'function') {
    win.requestIdleCallback(warm, { timeout: 3000 });
    return;
  }

  globalThis.setTimeout(warm, 0);
}
