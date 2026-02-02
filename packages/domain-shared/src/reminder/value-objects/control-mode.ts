import type { ControlMode as IControlMode } from '@dailyuse/contracts/reminder';

/**
 * 📝 控制模式 - 提醒的控制方式
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type ControlMode = IControlMode & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: IControlMode[] = ['Group', 'Individual'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const ControlMode = {
  // ================= 常量定义 =================
  
  Group: 'Group' as ControlMode,
  Individual: 'Individual' as ControlMode,

  // ================= 工厂方法 =================

  of(value: string): ControlMode {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ControlMode: ${value}`);
    }
    return value as ControlMode;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is ControlMode {
    return VALUES.includes(value as IControlMode);
  },

  // ================= 遍历方法 =================

  getAll(): ControlMode[] {
    return VALUES as ControlMode[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为组控制模式
   */
  isGroup(value: ControlMode): boolean {
    return value === 'Group';
  },

  /**
   * 判断是否为个体控制模式
   */
  isIndividual(value: ControlMode): boolean {
    return value === 'Individual';
  },
};
