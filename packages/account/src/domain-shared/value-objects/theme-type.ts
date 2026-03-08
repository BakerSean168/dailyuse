import type { ThemeType as IThemeType } from '@dailyuse/contracts/account';

export type ThemeType = IThemeType & { readonly __brand: unique symbol };

const VALUES: IThemeType[] = ['Light', 'Dark', 'System'];

export const ThemeType = {
  Light: 'Light' as ThemeType,
  Dark: 'Dark' as ThemeType,
  System: 'System' as ThemeType,

  of(value: string): ThemeType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid theme type: ${value}`);
    }
    return value;
  },

  isValid(value: string): value is ThemeType {
    return VALUES.includes(value as IThemeType);
  },

  getAll(): ThemeType[] {
    return VALUES as ThemeType[];
  },

  isLight(theme: ThemeType): boolean {
    return theme === this.Light;
  },
  isDark(theme: ThemeType): boolean {
    return theme === this.Dark;
  },
  isSystem(theme: ThemeType): boolean {
    return theme === this.System;
  },

  shouldUseDarkMode(theme: ThemeType, systemPrefersDark = false): boolean {
    switch (theme) {
      case this.Light:
        return false;
      case this.Dark:
        return true;
      case this.System:
        return systemPrefersDark;
      default:
        return false;
    }
  },
};
