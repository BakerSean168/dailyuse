import type { ReminderType as IReminderType } from '@dailyuse/contracts/reminder';

/**
 * 📝 提醒类型 - 提醒的类型分类
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type ReminderType = IReminderType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: IReminderType[] = ['OneTime', 'Recurring'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const ReminderType = {
  // ================= 常量定义 =================
  
  OneTime: 'OneTime' as ReminderType,
  Recurring: 'Recurring' as ReminderType,

  // ================= 工厂方法 =================

  of(value: string): ReminderType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ReminderType: ${value}`);
    }
    return value as ReminderType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is ReminderType {
    return VALUES.includes(value as IReminderType);
  },

  // ================= 遍历方法 =================

  getAll(): ReminderType[] {
    return VALUES as ReminderType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为一次性提醒
   */
  isOneTime(value: ReminderType): boolean {
    return value === 'OneTime';
  },

  /**
   * 判断是否为循环提醒
   */
  isRecurring(value: ReminderType): boolean {
    return value === 'Recurring';
  },
};
