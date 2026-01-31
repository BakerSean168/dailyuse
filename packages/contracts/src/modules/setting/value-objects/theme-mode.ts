/**
 * 主题模式
 */
export const ThemeMode = {
  Light: 'Light',
  Dark: 'Dark',
  Auto: 'Auto',
} as const;

export type ThemeMode = (typeof ThemeMode)[keyof typeof ThemeMode];
