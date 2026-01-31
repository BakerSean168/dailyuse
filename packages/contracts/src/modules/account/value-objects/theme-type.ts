export const ThemeType = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
  SYSTEM: 'SYSTEM',
} as const;

export type ThemeType = keyof typeof ThemeType;
