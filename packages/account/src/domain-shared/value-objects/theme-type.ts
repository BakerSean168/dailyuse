import type { ThemeType as IThemeType } from '@dailyuse/contracts/account';

export type ThemeType = IThemeType & { readonly __brand: unique symbol };

const VALUES: IThemeType[] = ['LIGHT', 'DARK', 'SYSTEM'];

export const ThemeType = {
  LIGHT: 'LIGHT' as ThemeType,
  DARK: 'DARK' as ThemeType,
  SYSTEM: 'SYSTEM' as ThemeType,

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

  isLight(theme: ThemeType): boolean { return theme === this.LIGHT; },
  isDark(theme: ThemeType): boolean { return theme === this.DARK; },
  isSystem(theme: ThemeType): boolean { return theme === this.SYSTEM; },

  shouldUseDarkMode(theme: ThemeType, systemPrefersDark = false): boolean {
    switch (theme) {
      case this.LIGHT: return false;
      case this.DARK: return true;
      case this.SYSTEM: return systemPrefersDark;
      default: return false;
    }
  },
};
