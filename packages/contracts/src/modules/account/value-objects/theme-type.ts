export const ThemeType = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
  SYSTEM: 'SYSTEM',
} as const;

export type ThemeType = (typeof ThemeType)[keyof typeof ThemeType];
