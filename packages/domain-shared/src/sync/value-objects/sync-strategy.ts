import type { SyncStrategy as ISyncStrategy } from '@dailyuse/contracts/sync';

/**
 * 📝 同步策略 - 同步的策略类型
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type SyncStrategy = ISyncStrategy & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: ISyncStrategy[] = ['Full', 'Incremental', 'Auto'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const SyncStrategy = {
  // ================= 常量定义 =================
  
  Full: 'Full' as SyncStrategy,
  Incremental: 'Incremental' as SyncStrategy,
  Auto: 'Auto' as SyncStrategy,

  // ================= 工厂方法 =================

  of(value: string): SyncStrategy {
    if (!this.isValid(value)) {
      throw new Error(`Invalid SyncStrategy: ${value}`);
    }
    return value as SyncStrategy;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is SyncStrategy {
    return VALUES.includes(value as ISyncStrategy);
  },

  // ================= 遍历方法 =================

  getAll(): SyncStrategy[] {
    return VALUES as SyncStrategy[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为全量同步
   */
  isFull(value: SyncStrategy): boolean {
    return value === 'Full';
  },

  /**
   * 判断是否为增量同步
   */
  isIncremental(value: SyncStrategy): boolean {
    return value === 'Incremental';
  },

  /**
   * 判断是否为自动策略
   */
  isAuto(value: SyncStrategy): boolean {
    return value === 'Auto';
  },

  /**
   * 判断是否为手动策略（非自动）
   */
  isManual(value: SyncStrategy): boolean {
    return value === 'Full' || value === 'Incremental';
  },
};
