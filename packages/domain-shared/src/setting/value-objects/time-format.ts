import type { TimeFormat as ITimeFormat } from '@dailyuse/contracts/setting';

/**
 * 📝 时间格式 - 时间显示格式
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type TimeFormat = ITimeFormat & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: ITimeFormat[] = ['H12', 'H24'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const TimeFormat = {
  // ================= 常量定义 =================
  
  H12: 'H12' as TimeFormat,
  H24: 'H24' as TimeFormat,

  // ================= 工厂方法 =================

  of(value: string): TimeFormat {
    if (!this.isValid(value)) {
      throw new Error(`Invalid TimeFormat: ${value}`);
    }
    return value as TimeFormat;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is TimeFormat {
    return VALUES.includes(value as ITimeFormat);
  },

  // ================= 遍历方法 =================

  getAll(): TimeFormat[] {
    return VALUES as TimeFormat[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为 12 小时格式
   */
  is12Hour(value: TimeFormat): boolean {
    return value === 'H12';
  },

  /**
   * 判断是否为 24 小时格式
   */
  is24Hour(value: TimeFormat): boolean {
    return value === 'H24';
  },
};
