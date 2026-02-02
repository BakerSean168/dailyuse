import type { ConflictStatus as IConflictStatus } from '@dailyuse/contracts/sync';

/**
 * 📝 冲突状态 - 同步冲突的解决状态
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type ConflictStatus = IConflictStatus & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: IConflictStatus[] = ['Unresolved', 'Resolved', 'Ignored'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const ConflictStatus = {
  // ================= 常量定义 =================
  
  Unresolved: 'Unresolved' as ConflictStatus,
  Resolved: 'Resolved' as ConflictStatus,
  Ignored: 'Ignored' as ConflictStatus,

  // ================= 工厂方法 =================

  of(value: string): ConflictStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ConflictStatus: ${value}`);
    }
    return value as ConflictStatus;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is ConflictStatus {
    return VALUES.includes(value as IConflictStatus);
  },

  // ================= 遍历方法 =================

  getAll(): ConflictStatus[] {
    return VALUES as ConflictStatus[];
  },

  // ================= 工具方法 =================

  /**
   * 判断冲突是否未解决
   */
  isUnresolved(value: ConflictStatus): boolean {
    return value === 'Unresolved';
  },

  /**
   * 判断冲突是否已解决
   */
  isResolved(value: ConflictStatus): boolean {
    return value === 'Resolved';
  },

  /**
   * 判断冲突是否被忽略
   */
  isIgnored(value: ConflictStatus): boolean {
    return value === 'Ignored';
  },

  /**
   * 判断是否需要处理
   */
  needsResolution(value: ConflictStatus): boolean {
    return value === 'Unresolved';
  },

  /**
   * 判断是否已处理（已解决或被忽略）
   */
  isHandled(value: ConflictStatus): boolean {
    return value === 'Resolved' || value === 'Ignored';
  },
};
