export const ThemeType = {
  Light: 'Light',
  Dark: 'Dark',
  System: 'System',
} as const;

export type ThemeType = (typeof ThemeType)[keyof typeof ThemeType];
