import { ThemeMode as ThemeModeContract, type ThemeMode as IThemeMode } from '@dailyuse/contracts/setting';

/**
 * 📝 主题模式 - 应用的主题模式
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type ThemeMode = IThemeMode & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: IThemeMode[] = Object.values(ThemeModeContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const ThemeMode = {
  // ================= 常量定义 =================
  
  Light: 'Light' as ThemeMode,
  Dark: 'Dark' as ThemeMode,
  Auto: 'Auto' as ThemeMode,

  // ================= 工厂方法 =================

  of(value: string): ThemeMode {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ThemeMode: ${value}`);
    }
    return value as ThemeMode;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is ThemeMode {
    return VALUES.includes(value as IThemeMode);
  },

  // ================= 遍历方法 =================

  getAll(): ThemeMode[] {
    return VALUES as ThemeMode[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为浅色主题
   */
  isLight(value: ThemeMode): boolean {
    return value === 'Light';
  },

  /**
   * 判断是否为深色主题
   */
  isDark(value: ThemeMode): boolean {
    return value === 'Dark';
  },

  /**
   * 判断是否为自动主题
   */
  isAuto(value: ThemeMode): boolean {
    return value === 'Auto';
  },

  /**
   * 判断是否为手动主题（非自动）
   */
  isManual(value: ThemeMode): boolean {
    return value === 'Light' || value === 'Dark';
  },
};
