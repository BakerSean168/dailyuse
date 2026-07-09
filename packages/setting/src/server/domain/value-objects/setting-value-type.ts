import { SettingValueType as SettingValueTypeContract, type SettingValueType as ISettingValueType } from '@dailyuse/contracts/setting';

/**
 * 📝 设置值类型 - 设置值的数据类型
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type SettingValueType = ISettingValueType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: ISettingValueType[] = Object.values(SettingValueTypeContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const SettingValueType = {
  // ================= 常量定义 =================
  
  String: 'String' as SettingValueType,
  Number: 'Number' as SettingValueType,
  Boolean: 'Boolean' as SettingValueType,
  Password: 'Password' as SettingValueType,
  Json: 'Json' as SettingValueType,
  Array: 'Array' as SettingValueType,
  Object: 'Object' as SettingValueType,

  // ================= 工厂方法 =================

  of(value: string): SettingValueType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid SettingValueType: ${value}`);
    }
    return value as SettingValueType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is SettingValueType {
    return VALUES.includes(value as ISettingValueType);
  },

  // ================= 遍历方法 =================

  getAll(): SettingValueType[] {
    return VALUES as SettingValueType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为基本类型
   */
  isPrimitive(value: SettingValueType): boolean {
    return value === 'String' || value === 'Number' || value === 'Boolean';
  },

  /**
   * 判断是否为复杂类型
   */
  isComplex(value: SettingValueType): boolean {
    return value === 'Json' || value === 'Array' || value === 'Object';
  },

  /**
   * 判断是否为敏感类型
   */
  isSensitive(value: SettingValueType): boolean {
    return value === 'Password';
  },
};
