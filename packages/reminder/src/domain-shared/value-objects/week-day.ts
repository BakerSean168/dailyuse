import type { WeekDay as IWeekDay } from '@dailyuse/contracts/reminder';

/**
 * 📝 星期 - 一周中的日期
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type WeekDay = IWeekDay & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: IWeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const WeekDay = {
  // ================= 常量定义 =================
  
  Monday: 'Monday' as WeekDay,
  Tuesday: 'Tuesday' as WeekDay,
  Wednesday: 'Wednesday' as WeekDay,
  Thursday: 'Thursday' as WeekDay,
  Friday: 'Friday' as WeekDay,
  Saturday: 'Saturday' as WeekDay,
  Sunday: 'Sunday' as WeekDay,

  // ================= 工厂方法 =================

  of(value: string): WeekDay {
    if (!this.isValid(value)) {
      throw new Error(`Invalid WeekDay: ${value}`);
    }
    return value as WeekDay;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is WeekDay {
    return VALUES.includes(value as IWeekDay);
  },

  // ================= 遍历方法 =================

  getAll(): WeekDay[] {
    return VALUES as WeekDay[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为工作日
   */
  isWeekday(value: WeekDay): boolean {
    return !this.isWeekend(value);
  },

  /**
   * 判断是否为周末
   */
  isWeekend(value: WeekDay): boolean {
    return value === 'Saturday' || value === 'Sunday';
  },

  /**
   * 获取下一天
   */
  getNext(value: WeekDay): WeekDay {
    const index = VALUES.indexOf(value as IWeekDay);
    return VALUES[(index + 1) % 7] as WeekDay;
  },

  /**
   * 获取前一天
   */
  getPrevious(value: WeekDay): WeekDay {
    const index = VALUES.indexOf(value as IWeekDay);
    return VALUES[(index - 1 + 7) % 7] as WeekDay;
  },
};
