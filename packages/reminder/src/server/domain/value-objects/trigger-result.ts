import { TriggerResult as TriggerResultContract, type TriggerResult as ITriggerResult } from '@memoflow/contracts/reminder';

/**
 * 📝 触发结果 - 提醒触发的结果状态
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type TriggerResult = ITriggerResult & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@memoflow/contracts).
const VALUES: ITriggerResult[] = Object.values(TriggerResultContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const TriggerResult = {
  // ================= 常量定义 =================
  
  Success: 'Success' as TriggerResult,
  Failed: 'Failed' as TriggerResult,
  Skipped: 'Skipped' as TriggerResult,

  // ================= 工厂方法 =================

  of(value: string): TriggerResult {
    if (!this.isValid(value)) {
      throw new Error(`Invalid TriggerResult: ${value}`);
    }
    return value as TriggerResult;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is TriggerResult {
    return VALUES.includes(value as ITriggerResult);
  },

  // ================= 遍历方法 =================

  getAll(): TriggerResult[] {
    return VALUES as TriggerResult[];
  },

  // ================= 工具方法 =================

  /**
   * 判断触发是否成功
   */
  isSuccess(value: TriggerResult): boolean {
    return value === 'Success';
  },

  /**
   * 判断触发是否失败
   */
  isFailed(value: TriggerResult): boolean {
    return value === 'Failed';
  },

  /**
   * 判断触发是否被跳过
   */
  isSkipped(value: TriggerResult): boolean {
    return value === 'Skipped';
  },

  /**
   * 判断是否为最终状态（不需要重试）
   */
  isFinal(value: TriggerResult): boolean {
    return value === 'Success' || value === 'Failed' || value === 'Skipped';
  },
};
