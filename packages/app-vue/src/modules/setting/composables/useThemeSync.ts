import { onScopeDispose, watch } from 'vue';
import { WindowChannels } from '@dailyuse/contracts/electron';
import { useUserSettingStore } from '../stores/userSettingStore';

type ThemeMode = 'light' | 'dark' | 'auto';

const DARK_CLASS = 'dark';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

function resolveThemeMode(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'auto') {
    return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
  }

  return theme;
}

function syncDesktopWindowChrome(theme: 'light' | 'dark'): void {
  void (
    window as Window & {
      electronAPI?: { invoke(channel: string, ...args: unknown[]): Promise<unknown> };
    }
  ).electronAPI?.invoke(WindowChannels.SYNC_CHROME_THEME, theme);
}

export function applyThemeMode(theme: ThemeMode | string | null | undefined): void {
  const safeTheme: ThemeMode =
    theme === 'dark' || theme === 'light' || theme === 'auto' ? theme : 'auto';
  const resolvedTheme = resolveThemeMode(safeTheme);
  const root = document.documentElement;

  root.classList.toggle(DARK_CLASS, resolvedTheme === 'dark');
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
  syncDesktopWindowChrome(resolvedTheme);
}

export function useThemeSync() {
  const store = useUserSettingStore();
  const mediaQuery = window.matchMedia(MEDIA_QUERY);

  const syncTheme = () => {
    applyThemeMode(store.getValue('appearance.theme') as ThemeMode | undefined);
  };

  syncTheme();

  watch(() => store.getValue('appearance.theme'), syncTheme);

  const handleSystemThemeChange = () => {
    if ((store.getValue('appearance.theme') as ThemeMode | undefined) === 'auto') {
      syncTheme();
    }
  };

  mediaQuery.addEventListener('change', handleSystemThemeChange);
  onScopeDispose(() => {
    mediaQuery.removeEventListener('change', handleSystemThemeChange);
  });

  return {
    syncTheme,
  };
}
