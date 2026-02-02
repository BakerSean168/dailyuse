import type { SyncGlobalStatus as ISyncGlobalStatus } from '@dailyuse/contracts/sync';

/**
 * 📝 全局同步状态 - 整个同步系统的全局状态
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type SyncGlobalStatus = ISyncGlobalStatus & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: ISyncGlobalStatus[] = ['Idle', 'Pending', 'Syncing', 'Conflict', 'Error', 'Offline'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const SyncGlobalStatus = {
  // ================= 常量定义 =================
  
  Idle: 'Idle' as SyncGlobalStatus,
  Pending: 'Pending' as SyncGlobalStatus,
  Syncing: 'Syncing' as SyncGlobalStatus,
  Conflict: 'Conflict' as SyncGlobalStatus,
  Error: 'Error' as SyncGlobalStatus,
  Offline: 'Offline' as SyncGlobalStatus,

  // ================= 工厂方法 =================

  of(value: string): SyncGlobalStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid SyncGlobalStatus: ${value}`);
    }
    return value as SyncGlobalStatus;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is SyncGlobalStatus {
    return VALUES.includes(value as ISyncGlobalStatus);
  },

  // ================= 遍历方法 =================

  getAll(): SyncGlobalStatus[] {
    return VALUES as SyncGlobalStatus[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否空闲
   */
  isIdle(value: SyncGlobalStatus): boolean {
    return value === 'Idle';
  },

  /**
   * 判断是否在同步中
   */
  isSyncing(value: SyncGlobalStatus): boolean {
    return value === 'Syncing';
  },

  /**
   * 判断是否有冲突
   */
  hasConflict(value: SyncGlobalStatus): boolean {
    return value === 'Conflict';
  },

  /**
   * 判断是否有错误
   */
  hasError(value: SyncGlobalStatus): boolean {
    return value === 'Error';
  },

  /**
   * 判断是否离线
   */
  isOffline(value: SyncGlobalStatus): boolean {
    return value === 'Offline';
  },

  /**
   * 判断是否处于活跃状态（不是空闲）
   */
  isActive(value: SyncGlobalStatus): boolean {
    return value !== 'Idle';
  },

  /**
   * 判断是否需要用户处理
   */
  needsAttention(value: SyncGlobalStatus): boolean {
    return value === 'Conflict' || value === 'Error' || value === 'Offline';
  },
};
