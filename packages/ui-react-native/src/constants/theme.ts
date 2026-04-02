import '../styles/global.css';

import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { type ColorSchemeName, Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111827',
    background: '#F5F7FB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E7EEF8',
    textSecondary: '#596579',
    tint: '#1F6FE5',
    border: '#D8E1EC',
    card: '#FFFFFF',
    success: '#228B5D',
    warning: '#D97706',
  },
  dark: {
    text: '#F5F7FA',
    background: '#0F141C',
    backgroundElement: '#181F2A',
    backgroundSelected: '#223042',
    textSecondary: '#9AA8BA',
    tint: '#6EA8FF',
    border: '#283445',
    card: '#181F2A',
    success: '#4CB782',
    warning: '#F5A623',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type AppThemeName = keyof typeof Colors;

export function resolveThemeName(scheme: ColorSchemeName): AppThemeName {
  return scheme === 'dark' ? 'dark' : 'light';
}

export function getNavigationTheme(scheme: ColorSchemeName): Theme {
  const themeName = resolveThemeName(scheme);
  const palette = Colors[themeName];
  const baseTheme = themeName === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: palette.tint,
      background: palette.background,
      card: palette.card,
      text: palette.text,
      border: palette.border,
      notification: palette.tint,
    },
  };
}

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
