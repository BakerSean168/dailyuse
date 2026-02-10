import type { ResourceStatus as IResourceStatus } from '@dailyuse/contracts/repository';

/**
 * 📝 资源状态 - 仓储中资源的生命周期状态
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type ResourceStatus = IResourceStatus & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: IResourceStatus[] = ['Active', 'Archived', 'Deleted', 'Draft'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const ResourceStatus = {
  // ================= 常量定义 =================
  
  Active: 'Active' as ResourceStatus,
  Archived: 'Archived' as ResourceStatus,
  Deleted: 'Deleted' as ResourceStatus,
  Draft: 'Draft' as ResourceStatus,

  // ================= 工厂方法 =================

  of(value: string): ResourceStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ResourceStatus: ${value}`);
    }
    return value as ResourceStatus;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is ResourceStatus {
    return VALUES.includes(value as IResourceStatus);
  },

  // ================= 遍历方法 =================

  getAll(): ResourceStatus[] {
    return VALUES as ResourceStatus[];
  },

  // ================= 工具方法 =================

  /**
   * 判断资源是否活跃
   */
  isActive(value: ResourceStatus): boolean {
    return value === 'Active';
  },

  /**
   * 判断资源是否已归档
   */
  isArchived(value: ResourceStatus): boolean {
    return value === 'Archived';
  },

  /**
   * 判断资源是否已删除
   */
  isDeleted(value: ResourceStatus): boolean {
    return value === 'Deleted';
  },

  /**
   * 判断资源是否为草稿
   */
  isDraft(value: ResourceStatus): boolean {
    return value === 'Draft';
  },

  /**
   * 判断资源是否已发布（活跃或已归档）
   */
  isPublished(value: ResourceStatus): boolean {
    return value === 'Active' || value === 'Archived';
  },

  /**
   * 判断资源是否可用（活跃、已归档或草稿）
   */
  isAvailable(value: ResourceStatus): boolean {
    return value !== 'Deleted';
  },
};
