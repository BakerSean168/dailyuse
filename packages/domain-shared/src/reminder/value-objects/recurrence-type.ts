import type { RecurrenceType as IRecurrenceType } from '@dailyuse/contracts/reminder';

/**
 * 📝 重复类型 - 提醒的重复方式
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type RecurrenceType = IRecurrenceType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: IRecurrenceType[] = ['Daily', 'Weekly', 'CustomDays'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const RecurrenceType = {
  // ================= 常量定义 =================
  
  Daily: 'Daily' as RecurrenceType,
  Weekly: 'Weekly' as RecurrenceType,
  CustomDays: 'CustomDays' as RecurrenceType,

  // ================= 工厂方法 =================

  of(value: string): RecurrenceType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid RecurrenceType: ${value}`);
    }
    return value as RecurrenceType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is RecurrenceType {
    return VALUES.includes(value as IRecurrenceType);
  },

  // ================= 遍历方法 =================

  getAll(): RecurrenceType[] {
    return VALUES as RecurrenceType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为每日重复
   */
  isDaily(value: RecurrenceType): boolean {
    return value === 'Daily';
  },

  /**
   * 判断是否为每周重复
   */
  isWeekly(value: RecurrenceType): boolean {
    return value === 'Weekly';
  },

  /**
   * 判断是否为自定义日期重复
   */
  isCustomDays(value: RecurrenceType): boolean {
    return value === 'CustomDays';
  },
};
