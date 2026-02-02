import type { ConflictResolutionStrategy as IConflictResolutionStrategy } from '@dailyuse/contracts/sync';

/**
 * 📝 冲突解决策略 - 同步冲突的解决策略
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type ConflictResolutionStrategy = IConflictResolutionStrategy & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: IConflictResolutionStrategy[] = ['LocalWins', 'RemoteWins', 'LatestWins', 'VectorClock', 'Manual'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const ConflictResolutionStrategy = {
  // ================= 常量定义 =================
  
  LocalWins: 'LocalWins' as ConflictResolutionStrategy,
  RemoteWins: 'RemoteWins' as ConflictResolutionStrategy,
  LatestWins: 'LatestWins' as ConflictResolutionStrategy,
  VectorClock: 'VectorClock' as ConflictResolutionStrategy,
  Manual: 'Manual' as ConflictResolutionStrategy,

  // ================= 工厂方法 =================

  of(value: string): ConflictResolutionStrategy {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ConflictResolutionStrategy: ${value}`);
    }
    return value as ConflictResolutionStrategy;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is ConflictResolutionStrategy {
    return VALUES.includes(value as IConflictResolutionStrategy);
  },

  // ================= 遍历方法 =================

  getAll(): ConflictResolutionStrategy[] {
    return VALUES as ConflictResolutionStrategy[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为自动解决策略
   */
  isAutomatic(value: ConflictResolutionStrategy): boolean {
    return value !== 'Manual';
  },

  /**
   * 判断是否为手动解决策略
   */
  isManual(value: ConflictResolutionStrategy): boolean {
    return value === 'Manual';
  },

  /**
   * 判断是否为本地优先策略
   */
  isLocalFavored(value: ConflictResolutionStrategy): boolean {
    return value === 'LocalWins';
  },

  /**
   * 判断是否为远程优先策略
   */
  isRemoteFavored(value: ConflictResolutionStrategy): boolean {
    return value === 'RemoteWins';
  },

  /**
   * 判断是否为基于时间的策略
   */
  isTimeBased(value: ConflictResolutionStrategy): boolean {
    return value === 'LatestWins';
  },

  /**
   * 判断是否为基于版本控制的策略
   */
  isVersionBased(value: ConflictResolutionStrategy): boolean {
    return value === 'VectorClock';
  },
};
