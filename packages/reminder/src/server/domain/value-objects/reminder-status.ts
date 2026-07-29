import { ReminderStatus as ReminderStatusContract, type ReminderStatus as IReminderStatus } from '@memoflow/contracts/reminder';

/**
 * 📝 提醒状态 - 提醒的生命周期状态
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type ReminderStatus = IReminderStatus & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@memoflow/contracts).
const VALUES: IReminderStatus[] = Object.values(ReminderStatusContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const ReminderStatus = {
  // ================= 常量定义 =================
  
  Active: 'Active' as ReminderStatus,
  Paused: 'Paused' as ReminderStatus,

  // ================= 工厂方法 =================

  of(value: string): ReminderStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ReminderStatus: ${value}`);
    }
    return value as ReminderStatus;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is ReminderStatus {
    return VALUES.includes(value as IReminderStatus);
  },

  // ================= 遍历方法 =================

  getAll(): ReminderStatus[] {
    return VALUES as ReminderStatus[];
  },

  // ================= 工具方法 =================

  /**
   * 判断提醒是否活跃
   */
  isActive(value: ReminderStatus): boolean {
    return value === 'Active';
  },

  /**
   * 判断提醒是否暂停
   */
  isPaused(value: ReminderStatus): boolean {
    return value === 'Paused';
  },
};
