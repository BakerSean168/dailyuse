import type { DeviceType as IDeviceType } from '@dailyuse/contracts/authentication';

/**
 * 📱 设备类型 - 登录设备的分�?
 *
 * Branded Type：运行时�?string，编译时具有类型安全�?
 */
export type DeviceType = IDeviceType & { readonly __brand: unique symbol };

/**
 * 合法值集�?- Single Source of Truth
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
   * 🛡�?类型守卫：运行时类型检�?
   */
  isValid(value: string): value is DeviceType {
    return VALUES.includes(value as IDeviceType);
  },

  /**
   * 📋 获取所有可用�?
   */
  getAll(): DeviceType[] {
    return VALUES as DeviceType[];
  },

  // ================= 行为方法 (State Logic) =================

  /**
   * 是否是手机设备（iOS �?Android�?
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
   * 是否是桌面应�?
   */
  isDesktop(type: DeviceType): boolean {
    return type === this.DESKTOP;
  },

  /**
   * 是否是平板设�?
   */
  isTablet(type: DeviceType): boolean {
    return type === this.TABLET;
  },

  /**
   * 是否是小屏幕设备（移动设备和平板�?
   */
  isSmallScreen(type: DeviceType): boolean {
    return this.isMobile(type) || this.isTablet(type);
  },

};
