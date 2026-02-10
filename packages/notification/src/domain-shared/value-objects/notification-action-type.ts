import type { NotificationActionType as INotificationActionType } from '@dailyuse/contracts/notification';

/**
 * 📝 通知操作类型 - 用户可以对通知执行的操作类型
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type NotificationActionType = INotificationActionType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: INotificationActionType[] = ['Navigate', 'ApiCall', 'Dismiss', 'Custom'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const NotificationActionType = {
  // ================= 常量定义 =================
  
  Navigate: 'Navigate' as NotificationActionType,
  ApiCall: 'ApiCall' as NotificationActionType,
  Dismiss: 'Dismiss' as NotificationActionType,
  Custom: 'Custom' as NotificationActionType,

  // ================= 工厂方法 =================

  of(value: string): NotificationActionType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid NotificationActionType: ${value}`);
    }
    return value as NotificationActionType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is NotificationActionType {
    return VALUES.includes(value as INotificationActionType);
  },

  // ================= 遍历方法 =================

  getAll(): NotificationActionType[] {
    return VALUES as NotificationActionType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为导航操作
   */
  isNavigation(value: NotificationActionType): boolean {
    return value === 'Navigate';
  },

  /**
   * 判断是否为 API 调用操作
   */
  isApiCall(value: NotificationActionType): boolean {
    return value === 'ApiCall';
  },

  /**
   * 判断是否需要处理（不是简单的关闭）
   */
  needsProcessing(value: NotificationActionType): boolean {
    return value === 'Navigate' || value === 'ApiCall' || value === 'Custom';
  },
};
