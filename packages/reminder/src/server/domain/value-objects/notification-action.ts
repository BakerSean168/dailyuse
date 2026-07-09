import { NotificationAction as NotificationActionContract, type NotificationAction as INotificationAction } from '@dailyuse/contracts/reminder';

/**
 * 📝 通知操作 - 用户对提醒通知可以执行的操作
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type NotificationAction = INotificationAction & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: INotificationAction[] = Object.values(NotificationActionContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const NotificationAction = {
  // ================= 常量定义 =================
  
  Dismiss: 'Dismiss' as NotificationAction,
  Snooze: 'Snooze' as NotificationAction,
  Complete: 'Complete' as NotificationAction,
  Custom: 'Custom' as NotificationAction,

  // ================= 工厂方法 =================

  of(value: string): NotificationAction {
    if (!this.isValid(value)) {
      throw new Error(`Invalid NotificationAction: ${value}`);
    }
    return value as NotificationAction;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is NotificationAction {
    return VALUES.includes(value as INotificationAction);
  },

  // ================= 遍历方法 =================

  getAll(): NotificationAction[] {
    return VALUES as NotificationAction[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为关闭操作
   */
  isDismiss(value: NotificationAction): boolean {
    return value === 'Dismiss';
  },

  /**
   * 判断是否为稍后提醒操作
   */
  isSnooze(value: NotificationAction): boolean {
    return value === 'Snooze';
  },

  /**
   * 判断是否为完成操作
   */
  isComplete(value: NotificationAction): boolean {
    return value === 'Complete';
  },

  /**
   * 判断是否为有实际业务处理的操作（非关闭）
   */
  needsProcessing(value: NotificationAction): boolean {
    return value === 'Snooze' || value === 'Complete' || value === 'Custom';
  },
};
