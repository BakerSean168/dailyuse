import type { DeviceType as IDeviceType } from '@dailyuse/contracts/authentication';

/**
 * 📱 设备类型 - 登录设备的分类
 *
 * Branded Type：运行时为 string，编译时具有类型安全性
 */
export type DeviceType = IDeviceType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 */
const VALUES: IDeviceType[] = ['BROWSER', 'MOBILE', 'DESKTOP', 'TABLET'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const DeviceType = {
  // ================= 常量定义 =================

  BROWSER: 'BROWSER' as DeviceType,
  MOBILE: 'MOBILE' as DeviceType,
  DESKTOP: 'DESKTOP' as DeviceType,
  TABLET: 'TABLET' as DeviceType,

  // ================= 工厂方法 =================

  /**
   * 🏭 工厂方法：验证并转换
   */
  of(value: string): DeviceType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid device type: ${value}`);
    }
    return value as DeviceType;
  },

  // ================= 类型守卫 =================

  /**
   * 🛡️ 类型守卫：运行时类型检查
   */
  isValid(value: string): value is DeviceType {
    return VALUES.includes(value as IDeviceType);
  },

  /**
   * 📋 获取所有可用值
   */
  getAll(): DeviceType[] {
    return VALUES as DeviceType[];
  },

  // ================= 行为方法 (State Logic) =================

  /**
   * 是否是手机设备（iOS 或 Android）
   */
  isMobile(type: DeviceType): boolean {
    return type === this.MOBILE;
  },

  /**
   * 是否是网页端
   */
  isBrowser(type: DeviceType): boolean {
    return type === this.BROWSER;
  },

  /**
   * 是否是桌面应用
   */
  isDesktop(type: DeviceType): boolean {
    return type === this.DESKTOP;
  },

  /**
   * 是否是平板设备
   */
  isTablet(type: DeviceType): boolean {
    return type === this.TABLET;
  },

  /**
   * 是否是小屏幕设备（移动设备和平板）
   */
  isSmallScreen(type: DeviceType): boolean {
    return this.isMobile(type) || this.isTablet(type);
  },

  /**
   * 获取 UI 显示名称
   */
  getDisplayName(type: DeviceType): string {
    const map: Record<IDeviceType, string> = {
      'BROWSER': '网页',
      'MOBILE': 'MOBILE',
      'DESKTOP': '桌面',
      'TABLET': '平板',
      "API": "API",
      "UNKNOWN": "未知"

    };
    return map[type as IDeviceType] ?? '未知设备';
  },

};
