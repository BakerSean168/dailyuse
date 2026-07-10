import { ResourceType as ResourceTypeContract, type ResourceType as IResourceType } from '@dailyuse/contracts/repository';

/**
 * 📝 资源类型 - 仓储中资源的类型
 *
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type ResourceType = IResourceType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: IResourceType[] = Object.values(ResourceTypeContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const ResourceType = {
  // ================= 常量定义 =================

  File: 'File' as ResourceType,
  Folder: 'Folder' as ResourceType,

  // ================= 工厂方法 =================

  of(value: string): ResourceType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ResourceType: ${value}`);
    }
    return value as ResourceType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is ResourceType {
    return VALUES.includes(value as IResourceType);
  },

  // ================= 遍历方法 =================

  getAll(): ResourceType[] {
    return VALUES as ResourceType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为文件
   */
  isFile(value: ResourceType): boolean {
    return value === 'File';
  },

  /**
   * 判断是否为文件夹
   */
  isFolder(value: ResourceType): boolean {
    return value === 'Folder';
  },
};
