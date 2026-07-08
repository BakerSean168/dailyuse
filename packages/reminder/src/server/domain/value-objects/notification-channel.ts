import type { NotificationChannel as INotificationChannel } from '@dailyuse/contracts/reminder';

/**
 * 📝 通知渠道 - 提醒的通知投递渠道
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type NotificationChannel = INotificationChannel & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: INotificationChannel[] = ['InApp', 'Push', 'Email', 'Sms'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const NotificationChannel = {
  // ================= 常量定义 =================
  
  InApp: 'InApp' as NotificationChannel,
  Push: 'Push' as NotificationChannel,
  Email: 'Email' as NotificationChannel,
  Sms: 'Sms' as NotificationChannel,

  // ================= 工厂方法 =================

  of(value: string): NotificationChannel {
    if (!this.isValid(value)) {
      throw new Error(`Invalid NotificationChannel: ${value}`);
    }
    return value as NotificationChannel;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is NotificationChannel {
    return VALUES.includes(value as INotificationChannel);
  },

  // ================= 遍历方法 =================

  getAll(): NotificationChannel[] {
    return VALUES as NotificationChannel[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为实时渠道
   */
  isRealtime(value: NotificationChannel): boolean {
    return value === 'InApp' || value === 'Push' || value === 'Sms';
  },

  /**
   * 判断是否为邮件渠道
   */
  isEmail(value: NotificationChannel): boolean {
    return value === 'Email';
  },

  /**
   * 判断是否为应用内通知
   */
  isInApp(value: NotificationChannel): boolean {
    return value === 'InApp';
  },
};
