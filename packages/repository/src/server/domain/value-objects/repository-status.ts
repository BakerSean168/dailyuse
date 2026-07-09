import { RepositoryStatus as RepositoryStatusContract, type RepositoryStatus as IRepositoryStatus } from '@dailyuse/contracts/repository';

/**
 * 📝 仓储状态 - 仓储的生命周期状态
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type RepositoryStatus = IRepositoryStatus & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: IRepositoryStatus[] = Object.values(RepositoryStatusContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const RepositoryStatus = {
  // ================= 常量定义 =================
  
  Active: 'Active' as RepositoryStatus,
  Archived: 'Archived' as RepositoryStatus,
  Deleted: 'Deleted' as RepositoryStatus,

  // ================= 工厂方法 =================

  of(value: string): RepositoryStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid RepositoryStatus: ${value}`);
    }
    return value as RepositoryStatus;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is RepositoryStatus {
    return VALUES.includes(value as IRepositoryStatus);
  },

  // ================= 遍历方法 =================

  getAll(): RepositoryStatus[] {
    return VALUES as RepositoryStatus[];
  },

  // ================= 工具方法 =================

  /**
   * 判断仓储是否活跃
   */
  isActive(value: RepositoryStatus): boolean {
    return value === 'Active';
  },

  /**
   * 判断仓储是否已归档
   */
  isArchived(value: RepositoryStatus): boolean {
    return value === 'Archived';
  },

  /**
   * 判断仓储是否已删除
   */
  isDeleted(value: RepositoryStatus): boolean {
    return value === 'Deleted';
  },

  /**
   * 判断仓储是否可用（活跃或已归档）
   */
  isAvailable(value: RepositoryStatus): boolean {
    return value === 'Active' || value === 'Archived';
  },
};
