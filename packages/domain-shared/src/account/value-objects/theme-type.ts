import type { ThemeType as IThemeType } from '@dailyuse/contracts/account';

/**
 * 🎨 主题类型 - 应用界面主题偏好
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type ThemeType = IThemeType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: IThemeType[] = ['LIGHT', 'DARK', 'SYSTEM'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 * 没有 this，所有行为方法第一个参数都是该 Type 的实例
 */
export const ThemeType = {
  // ================= 常量定义 =================
  
  LIGHT: 'LIGHT' as ThemeType,
  DARK: 'DARK' as ThemeType,
  SYSTEM: 'SYSTEM' as ThemeType,

  // ================= 工厂方法 =================

  /**
   * 🏭 工厂方法：验证并转换
   * 接受任意 string，返回安全的 ThemeType
   * @throws 当输入值不在合法值列表中时
   */
  of(value: string): ThemeType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid theme type: ${value}`);
    }
    return value;
  },

  // ================= 类型守卫 =================

  /**
   * 🛡️ 类型守卫：运行时类型检查
   * 用于条件判断时的类型细化
   * @example
   * if (ThemeType.isValid(input)) {
   *   const theme: ThemeType = input; // TS 自动推断
   * }
   */
  isValid(value: string): value is ThemeType {
    return VALUES.includes(value as IThemeType);
  },

  /**
   * 📋 获取所有可用值
   * 用于前端渲染下拉框、单选按钮等选项
   */
  getAll(): ThemeType[] {
    return VALUES as ThemeType[];
  },

  // ================= 行为方法 (State Logic) =================

  /**
   * 是否为浅色主题
   */
  isLight(theme: ThemeType): boolean {
    return theme === this.LIGHT;
  },

  /**
   * 是否为深色主题
   */
  isDark(theme: ThemeType): boolean {
    return theme === this.DARK;
  },

  /**
   * 是否跟随系统设置
   */
  isSystem(theme: ThemeType): boolean {
    return theme === this.SYSTEM;
  },

  /**
   * 是否需要使用深色模式
   * 结合系统偏好进行决策
   */
  shouldUseDarkMode(theme: ThemeType, systemPrefersDark: boolean = false): boolean {
    switch (theme) {
      case this.LIGHT: 
        return false;
      case this.DARK: 
        return true;
      case this.SYSTEM: 
        return systemPrefersDark;
      default: 
        return false;
    }
  },

  /**
   * 获取 UI 显示名称（用于列表展示）
   */
  getDisplayName(theme: ThemeType): string {
    switch (theme) {
      case this.LIGHT: return '浅色';
      case this.DARK: return '深色';
      case this.SYSTEM: return '跟随系统';
      default: return '未知';
    }
  }
};