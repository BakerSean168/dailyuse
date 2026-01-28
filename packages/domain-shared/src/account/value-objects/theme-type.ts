import type { ThemeType as IThemeType } from '@dailyuse/contracts/account';

// Branded Type - 主题值对象
export type ThemeType = IThemeType & { readonly __brand: unique symbol };

// 伴生对象 - 提供行为逻辑
export const ThemeType = {
  // 预定义值
  LIGHT: 'LIGHT' as ThemeType,
  DARK: 'DARK' as ThemeType,
  SYSTEM: 'SYSTEM' as ThemeType,

  // 工厂方法
  of(value: string): ThemeType {
    const validValues = [this.LIGHT, this.DARK, this.SYSTEM];
    const theme = validValues.find(t => t === value);
    if (!theme) {
      throw new Error(`Invalid theme type: ${value}`);
    }
    return theme;
  },

  // 行为方法
  isLight(theme: ThemeType): boolean {
    return theme === this.LIGHT;
  },

  isDark(theme: ThemeType): boolean {
    return theme === this.DARK;
  },

  isSystem(theme: ThemeType): boolean {
    return theme === this.SYSTEM;
  },

  shouldUseDarkMode(theme: ThemeType, systemPrefersDark: boolean = false): boolean {
    switch (theme) {
      case this.LIGHT: return false;
      case this.DARK: return true;
      case this.SYSTEM: return systemPrefersDark;
      default: return false;
    }
  },

  getDisplayName(theme: ThemeType): string {
    switch (theme) {
      case this.LIGHT: return '浅色';
      case this.DARK: return '深色';
      case this.SYSTEM: return '跟随系统';
      default: return '未知';
    }
  }
};