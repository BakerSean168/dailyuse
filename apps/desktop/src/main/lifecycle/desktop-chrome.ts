import { nativeTheme } from 'electron';
import type { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';

export type DesktopChromeTheme = 'light' | 'dark';

interface DesktopChromePalette {
  background: string;
  foreground: string;
}

function getDesktopChromePalette(): DesktopChromePalette {
  return getDesktopChromePaletteForTheme(nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
}

export function getDesktopChromePaletteForTheme(theme: DesktopChromeTheme): DesktopChromePalette {
  return theme === 'dark'
    ? {
        background: '#121216',
        foreground: '#fafafa',
      }
    : {
        background: '#ffffff',
        foreground: '#09090b',
      };
}

export function createNativeWindowChromeOptions(): Pick<
  BrowserWindowConstructorOptions,
  'autoHideMenuBar' | 'backgroundColor' | 'title' | 'titleBarStyle'
> {
  const palette = getDesktopChromePalette();
  const options: Pick<
    BrowserWindowConstructorOptions,
    'autoHideMenuBar' | 'backgroundColor' | 'title' | 'titleBarStyle'
  > = {
    autoHideMenuBar: true,
    backgroundColor: palette.background,
    title: '',
    titleBarStyle: 'hidden',
  };

  return options;
}

export function applyWindowChromeTheme(
  window: BrowserWindow,
  theme: DesktopChromeTheme,
): DesktopChromePalette {
  const palette = getDesktopChromePaletteForTheme(theme);

  window.setBackgroundColor(palette.background);

  return palette;
}
