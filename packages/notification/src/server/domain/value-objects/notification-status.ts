import { NotificationStatus as NotificationStatusContract, type NotificationStatus as INotificationStatus } from '@memoflow/contracts/notification';

/**
 * 📝 通知状态 - 通知的生命周期状态
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type NotificationStatus = INotificationStatus & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@memoflow/contracts).
const VALUES: INotificationStatus[] = Object.values(NotificationStatusContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const NotificationStatus = {
  // ================= 常量定义 =================
  
  Pending: 'Pending' as NotificationStatus,
  Sent: 'Sent' as NotificationStatus,
  Delivered: 'Delivered' as NotificationStatus,
  Read: 'Read' as NotificationStatus,
  Failed: 'Failed' as NotificationStatus,
  Cancelled: 'Cancelled' as NotificationStatus,

  // ================= 工厂方法 =================

  of(value: string): NotificationStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid NotificationStatus: ${value}`);
    }
    return value as NotificationStatus;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is NotificationStatus {
    return VALUES.includes(value as INotificationStatus);
  },

  // ================= 遍历方法 =================

  getAll(): NotificationStatus[] {
    return VALUES as NotificationStatus[];
  },

  // ================= 工具方法 =================

  /**
   * 判断通知是否已送达
   */
  isDelivered(value: NotificationStatus): boolean {
    return value === 'Delivered' || value === 'Read';
  },

  /**
   * 判断通知是否已终止（失败或被取消）
   */
  isTerminated(value: NotificationStatus): boolean {
    return value === 'Failed' || value === 'Cancelled';
  },

  /**
   * 判断通知是否待发送
   */
  isPending(value: NotificationStatus): boolean {
    return value === 'Pending';
  },
};
