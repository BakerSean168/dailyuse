import { SettingCategory as SettingCategoryContract, type SettingCategory as ISettingCategory } from '@dailyuse/contracts/setting';

/**
 * 📝 设置分类 - 设置的功能分类
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type SettingCategory = ISettingCategory & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: ISettingCategory[] = Object.values(SettingCategoryContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const SettingCategory = {
  // ================= 常量定义 =================
  
  Appearance: 'Appearance' as SettingCategory,
  Editor: 'Editor' as SettingCategory,
  Task: 'Task' as SettingCategory,
  Goal: 'Goal' as SettingCategory,
  Repository: 'Repository' as SettingCategory,
  Notification: 'Notification' as SettingCategory,
  System: 'System' as SettingCategory,
  Privacy: 'Privacy' as SettingCategory,

  // ================= 工厂方法 =================

  of(value: string): SettingCategory {
    if (!this.isValid(value)) {
      throw new Error(`Invalid SettingCategory: ${value}`);
    }
    return value as SettingCategory;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is SettingCategory {
    return VALUES.includes(value as ISettingCategory);
  },

  // ================= 遍历方法 =================

  getAll(): SettingCategory[] {
    return VALUES as SettingCategory[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为外观相关设置
   */
  isAppearance(value: SettingCategory): boolean {
    return value === 'Appearance';
  },

  /**
   * 判断是否为编辑器相关设置
   */
  isEditor(value: SettingCategory): boolean {
    return value === 'Editor';
  },

  /**
   * 判断是否为功能模块设置
   */
  isFeature(value: SettingCategory): boolean {
    return value === 'Task' || value === 'Goal' || value === 'Repository' || value === 'Notification';
  },

  /**
   * 判断是否为安全隐私相关设置
   */
  isSecurity(value: SettingCategory): boolean {
    return value === 'Privacy' || value === 'System';
  },
};
