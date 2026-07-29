import { ThemeType as ThemeTypeContract, type ThemeType as IThemeType } from '@memoflow/contracts/account';

export type ThemeType = IThemeType & { readonly __brand: unique symbol };

// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@memoflow/contracts).
const VALUES: IThemeType[] = Object.values(ThemeTypeContract);

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
