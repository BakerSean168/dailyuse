import type { SyncSessionStatus as ISyncSessionStatus } from '@dailyuse/contracts/sync';

/**
 * 📝 同步会话状态 - 同步会话的生命周期状态
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type SyncSessionStatus = ISyncSessionStatus & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: ISyncSessionStatus[] = ['Pending', 'Collecting', 'Syncing', 'Conflicted', 'Completed', 'Failed', 'Cancelled'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const SyncSessionStatus = {
  // ================= 常量定义 =================
  
  Pending: 'Pending' as SyncSessionStatus,
  Collecting: 'Collecting' as SyncSessionStatus,
  Syncing: 'Syncing' as SyncSessionStatus,
  Conflicted: 'Conflicted' as SyncSessionStatus,
  Completed: 'Completed' as SyncSessionStatus,
  Failed: 'Failed' as SyncSessionStatus,
  Cancelled: 'Cancelled' as SyncSessionStatus,

  // ================= 工厂方法 =================

  of(value: string): SyncSessionStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid SyncSessionStatus: ${value}`);
    }
    return value as SyncSessionStatus;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is SyncSessionStatus {
    return VALUES.includes(value as ISyncSessionStatus);
  },

  // ================= 遍历方法 =================

  getAll(): SyncSessionStatus[] {
    return VALUES as SyncSessionStatus[];
  },

  // ================= 工具方法 =================

  /**
   * 判断同步是否已完成
   */
  isCompleted(value: SyncSessionStatus): boolean {
    return value === 'Completed';
  },

  /**
   * 判断同步是否失败
   */
  isFailed(value: SyncSessionStatus): boolean {
    return value === 'Failed';
  },

  /**
   * 判断同步是否有冲突
   */
  isConflicted(value: SyncSessionStatus): boolean {
    return value === 'Conflicted';
  },

  /**
   * 判断同步是否仍在进行
   */
  isInProgress(value: SyncSessionStatus): boolean {
    return value === 'Pending' || value === 'Collecting' || value === 'Syncing';
  },

  /**
   * 判断同步是否已终止
   */
  isTerminated(value: SyncSessionStatus): boolean {
    return value === 'Completed' || value === 'Failed' || value === 'Cancelled';
  },
};
