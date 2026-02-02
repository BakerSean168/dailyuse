import type { ScheduleViewType as IScheduleViewType } from '@dailyuse/contracts/setting';

/**
 * 📝 日程视图类型 - 日程的显示视图类型
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type ScheduleViewType = IScheduleViewType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: IScheduleViewType[] = ['Day', 'Week', 'Month'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const ScheduleViewType = {
  // ================= 常量定义 =================
  
  Day: 'Day' as ScheduleViewType,
  Week: 'Week' as ScheduleViewType,
  Month: 'Month' as ScheduleViewType,

  // ================= 工厂方法 =================

  of(value: string): ScheduleViewType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ScheduleViewType: ${value}`);
    }
    return value as ScheduleViewType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is ScheduleViewType {
    return VALUES.includes(value as IScheduleViewType);
  },

  // ================= 遍历方法 =================

  getAll(): ScheduleViewType[] {
    return VALUES as ScheduleViewType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为日视图
   */
  isDay(value: ScheduleViewType): boolean {
    return value === 'Day';
  },

  /**
   * 判断是否为周视图
   */
  isWeek(value: ScheduleViewType): boolean {
    return value === 'Week';
  },

  /**
   * 判断是否为月视图
   */
  isMonth(value: ScheduleViewType): boolean {
    return value === 'Month';
  },
};
