import type { TriggerType as ITriggerType } from '@dailyuse/contracts/reminder';

/**
 * 📝 触发器类型 - 提醒触发的方式
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type TriggerType = ITriggerType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: ITriggerType[] = ['FixedTime', 'Interval'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const TriggerType = {
  // ================= 常量定义 =================
  
  FixedTime: 'FixedTime' as TriggerType,
  Interval: 'Interval' as TriggerType,

  // ================= 工厂方法 =================

  of(value: string): TriggerType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid TriggerType: ${value}`);
    }
    return value as TriggerType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is TriggerType {
    return VALUES.includes(value as ITriggerType);
  },

  // ================= 遍历方法 =================

  getAll(): TriggerType[] {
    return VALUES as TriggerType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为固定时间触发
   */
  isFixedTime(value: TriggerType): boolean {
    return value === 'FixedTime';
  },

  /**
   * 判断是否为间隔触发
   */
  isInterval(value: TriggerType): boolean {
    return value === 'Interval';
  },
};
