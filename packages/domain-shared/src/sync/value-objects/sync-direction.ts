import type { SyncDirection as ISyncDirection } from '@dailyuse/contracts/sync';

/**
 * 📝 同步方向 - 同步的方向类型
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type SyncDirection = ISyncDirection & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: ISyncDirection[] = ['Push', 'Pull', 'Bidirectional'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const SyncDirection = {
  // ================= 常量定义 =================
  
  Push: 'Push' as SyncDirection,
  Pull: 'Pull' as SyncDirection,
  Bidirectional: 'Bidirectional' as SyncDirection,

  // ================= 工厂方法 =================

  of(value: string): SyncDirection {
    if (!this.isValid(value)) {
      throw new Error(`Invalid SyncDirection: ${value}`);
    }
    return value as SyncDirection;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is SyncDirection {
    return VALUES.includes(value as ISyncDirection);
  },

  // ================= 遍历方法 =================

  getAll(): SyncDirection[] {
    return VALUES as SyncDirection[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为推送（上传）
   */
  isPush(value: SyncDirection): boolean {
    return value === 'Push';
  },

  /**
   * 判断是否为拉取（下载）
   */
  isPull(value: SyncDirection): boolean {
    return value === 'Pull';
  },

  /**
   * 判断是否为双向同步
   */
  isBidirectional(value: SyncDirection): boolean {
    return value === 'Bidirectional';
  },

  /**
   * 判断是否包含上传功能
   */
  supportsUpload(value: SyncDirection): boolean {
    return value === 'Push' || value === 'Bidirectional';
  },

  /**
   * 判断是否包含下载功能
   */
  supportsDownload(value: SyncDirection): boolean {
    return value === 'Pull' || value === 'Bidirectional';
  },
};
