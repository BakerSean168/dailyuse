import { RepositoryType as RepositoryTypeContract, type RepositoryType as IRepositoryType } from '@dailyuse/contracts/repository';

/**
 * 📝 仓储类型 - 仓储的类型分类
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type RepositoryType = IRepositoryType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: IRepositoryType[] = Object.values(RepositoryTypeContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const RepositoryType = {
  // ================= 常量定义 =================
  
  Markdown: 'Markdown' as RepositoryType,
  Code: 'Code' as RepositoryType,
  Mixed: 'Mixed' as RepositoryType,

  // ================= 工厂方法 =================

  of(value: string): RepositoryType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid RepositoryType: ${value}`);
    }
    return value as RepositoryType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is RepositoryType {
    return VALUES.includes(value as IRepositoryType);
  },

  // ================= 遍历方法 =================

  getAll(): RepositoryType[] {
    return VALUES as RepositoryType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为 Markdown 仓储
   */
  isMarkdown(value: RepositoryType): boolean {
    return value === 'Markdown';
  },

  /**
   * 判断是否为代码仓储
   */
  isCode(value: RepositoryType): boolean {
    return value === 'Code';
  },

  /**
   * 判断是否为混合仓储
   */
  isMixed(value: RepositoryType): boolean {
    return value === 'Mixed';
  },
};
