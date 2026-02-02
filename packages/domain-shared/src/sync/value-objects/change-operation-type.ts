import type { ChangeOperationType as IChangeOperationType } from '@dailyuse/contracts/sync';

/**
 * 📝 变更操作类型 - 同步中的变更操作类型
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type ChangeOperationType = IChangeOperationType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: IChangeOperationType[] = ['Create', 'Update', 'Delete', 'Restore'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const ChangeOperationType = {
  // ================= 常量定义 =================
  
  Create: 'Create' as ChangeOperationType,
  Update: 'Update' as ChangeOperationType,
  Delete: 'Delete' as ChangeOperationType,
  Restore: 'Restore' as ChangeOperationType,

  // ================= 工厂方法 =================

  of(value: string): ChangeOperationType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ChangeOperationType: ${value}`);
    }
    return value as ChangeOperationType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is ChangeOperationType {
    return VALUES.includes(value as IChangeOperationType);
  },

  // ================= 遍历方法 =================

  getAll(): ChangeOperationType[] {
    return VALUES as ChangeOperationType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为创建操作
   */
  isCreate(value: ChangeOperationType): boolean {
    return value === 'Create';
  },

  /**
   * 判断是否为更新操作
   */
  isUpdate(value: ChangeOperationType): boolean {
    return value === 'Update';
  },

  /**
   * 判断是否为删除操作
   */
  isDelete(value: ChangeOperationType): boolean {
    return value === 'Delete';
  },

  /**
   * 判断是否为恢复操作
   */
  isRestore(value: ChangeOperationType): boolean {
    return value === 'Restore';
  },

  /**
   * 判断是否为破坏性操作（删除）
   */
  isDestructive(value: ChangeOperationType): boolean {
    return value === 'Delete';
  },

  /**
   * 判断是否为恢复性操作
   */
  isRecovery(value: ChangeOperationType): boolean {
    return value === 'Restore';
  },
};
