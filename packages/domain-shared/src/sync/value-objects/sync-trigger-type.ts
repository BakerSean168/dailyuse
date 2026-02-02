import type { SyncTriggerType as ISyncTriggerType } from '@dailyuse/contracts/sync';

/**
 * 📝 同步触发方式 - 同步的触发方式
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type SyncTriggerType = ISyncTriggerType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: ISyncTriggerType[] = ['Manual', 'AutoScheduled', 'OnChange', 'OnStartup', 'OnNetworkRestore'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const SyncTriggerType = {
  // ================= 常量定义 =================
  
  Manual: 'Manual' as SyncTriggerType,
  AutoScheduled: 'AutoScheduled' as SyncTriggerType,
  OnChange: 'OnChange' as SyncTriggerType,
  OnStartup: 'OnStartup' as SyncTriggerType,
  OnNetworkRestore: 'OnNetworkRestore' as SyncTriggerType,

  // ================= 工厂方法 =================

  of(value: string): SyncTriggerType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid SyncTriggerType: ${value}`);
    }
    return value as SyncTriggerType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is SyncTriggerType {
    return VALUES.includes(value as ISyncTriggerType);
  },

  // ================= 遍历方法 =================

  getAll(): SyncTriggerType[] {
    return VALUES as SyncTriggerType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为手动触发
   */
  isManual(value: SyncTriggerType): boolean {
    return value === 'Manual';
  },

  /**
   * 判断是否为自动触发
   */
  isAutomatic(value: SyncTriggerType): boolean {
    return value !== 'Manual';
  },

  /**
   * 判断是否为计划自动触发
   */
  isAutoScheduled(value: SyncTriggerType): boolean {
    return value === 'AutoScheduled';
  },

  /**
   * 判断是否为变更触发
   */
  isChangeTriggered(value: SyncTriggerType): boolean {
    return value === 'OnChange';
  },

  /**
   * 判断是否为启动触发
   */
  isStartupTriggered(value: SyncTriggerType): boolean {
    return value === 'OnStartup';
  },

  /**
   * 判断是否为网络恢复触发
   */
  isNetworkRestoreTriggered(value: SyncTriggerType): boolean {
    return value === 'OnNetworkRestore';
  },
};
