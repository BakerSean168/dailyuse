import { OperatorType as OperatorTypeContract, type OperatorType as IOperatorType } from '@dailyuse/contracts/setting';

/**
 * 📝 操作者类型 - 修改设置的操作者类型
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type OperatorType = IOperatorType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: IOperatorType[] = Object.values(OperatorTypeContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const OperatorType = {
  // ================= 常量定义 =================
  
  User: 'User' as OperatorType,
  System: 'System' as OperatorType,
  Api: 'Api' as OperatorType,

  // ================= 工厂方法 =================

  of(value: string): OperatorType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid OperatorType: ${value}`);
    }
    return value as OperatorType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is OperatorType {
    return VALUES.includes(value as IOperatorType);
  },

  // ================= 遍历方法 =================

  getAll(): OperatorType[] {
    return VALUES as OperatorType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为用户操作
   */
  isUser(value: OperatorType): boolean {
    return value === 'User';
  },

  /**
   * 判断是否为系统操作
   */
  isSystem(value: OperatorType): boolean {
    return value === 'System';
  },

  /**
   * 判断是否为 API 操作
   */
  isApi(value: OperatorType): boolean {
    return value === 'Api';
  },

  /**
   * 判断是否为自动操作（系统或 API）
   */
  isAutomatic(value: OperatorType): boolean {
    return value === 'System' || value === 'Api';
  },
};
